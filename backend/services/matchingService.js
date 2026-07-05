const Match = require('../models/Match');
const Notification = require('../models/Notification');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const qdrantService = require('./qdrantService');
const config = require('../config/aiConfig');

const calculateCategorySimilarity = (cat1, cat2) => {
  return cat1.toLowerCase() === cat2.toLowerCase() ? 100 : 0;
};

const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const tokens1 = text1.toLowerCase().split(/\W+/).filter(Boolean);
  const tokens2 = text2.toLowerCase().split(/\W+/).filter(Boolean);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const set1 = new Set(tokens1);
  const set2 = new Set(tokens2);
  let intersection = 0;
  for (let token of set1) {
    if (set2.has(token)) intersection++;
  }
  
  const union = new Set([...set1, ...set2]).size;
  return Math.round((intersection / union) * 100);
};

const calculateDateSimilarity = (date1, date2) => {
  if (!date1 || !date2) return 50; // Neutral score if missing
  const diffTime = Math.abs(new Date(date1) - new Date(date2));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, 100 - (diffDays * 10));
};

const getConfidenceLevel = (score) => {
  if (score >= 95) return 'Very High';
  if (score >= 90) return 'High';
  if (score >= 80) return 'Medium';
  return 'Low';
};

/**
 * Retrieve candidates from Qdrant, re-rank them, store matches, and return performance metrics.
 */
exports.findMatches = async (newItem, itemType, textEmbedding, imageEmbedding, campusZone) => {
  try {
    const isLost = itemType === 'lost';
    const targetType = isLost ? 'Found' : 'Lost';
    const targetModel = isLost ? FoundItem : LostItem;
    
    // Stage 1: Retrieval from Qdrant
    const searchFilters = {
      reportType: targetType,
      status: 'Active',
      category: newItem.category,
      campusZone
    };

    console.log(`[Matching] Stage 1: Retrieving candidates from Qdrant using filters:`, searchFilters);

    // Get Text Candidates
    const textHits = await qdrantService.searchVectors('text_embeddings', textEmbedding, searchFilters);
    
    // Get Image Candidates (if image exists)
    let imageHits = [];
    if (imageEmbedding && newItem.image) {
      imageHits = await qdrantService.searchVectors('image_embeddings', imageEmbedding, searchFilters);
    }

    const retrievedCount = textHits.length + imageHits.length;
    console.log(`[Matching] Qdrant returned ${textHits.length} text hits and ${imageHits.length} image hits.`);

    // Merge Candidate Lists
    const candidateIds = new Set();
    const candidateScores = {}; // reportId -> { textScore, imageScore }

    for (const hit of textHits) {
      candidateIds.add(hit.reportId);
      candidateScores[hit.reportId] = { textScore: hit.score, imageScore: null };
    }

    for (const hit of imageHits) {
      candidateIds.add(hit.reportId);
      if (!candidateScores[hit.reportId]) {
        candidateScores[hit.reportId] = { textScore: null, imageScore: hit.score };
      } else {
        candidateScores[hit.reportId].imageScore = hit.score;
      }
    }

    let candidates = [];
    if (candidateIds.size === 0) {
      console.log('[Matching] No candidates found in Qdrant. Falling back to active records from MongoDB.');
      const fallbackQuery = { status: 'Active' };
      if (newItem.category) fallbackQuery.category = newItem.category;

      candidates = await targetModel.find(fallbackQuery);
      candidates.forEach(candidate => {
        const id = candidate._id.toString();
        candidateIds.add(id);
        candidateScores[id] = { textScore: null, imageScore: null };
      });
    } else {
      // Stage 2: Re-ranking retrieved candidates
      console.log(`[Matching] Stage 2: Re-ranking ${candidateIds.size} unique candidates...`);
      candidates = await targetModel.find({ _id: { $in: Array.from(candidateIds) } });
    }

    let matchCount = 0;

    for (const candidate of candidates) {
      const lostItem = isLost ? newItem : candidate;
      const foundItem = isLost ? candidate : newItem;

      // Don't match if it's the same user reporting both
      if (lostItem.reportedBy.toString() === foundItem.reportedBy.toString()) {
        continue;
      }

      // Check if match already exists in MongoDB
      const existingMatch = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
      if (existingMatch) continue;

      // Compute similarities
      const scores = candidateScores[candidate._id.toString()];
      
      // Qdrant returns cosine values in [-1, 1], normal range [0, 1]. Multiply by 100.
      // If a candidate is missing in image retrieval, default to 0.
      const clipSimilarity = scores.imageScore ? Math.round(scores.imageScore * 100) : 0;
      const fallbackSemanticSimilarity = calculateTextSimilarity(
        `${lostItem.title || ''} ${lostItem.description || ''}`,
        `${foundItem.title || ''} ${foundItem.description || ''}`
      );
      const semanticSimilarity = scores.textScore ? Math.round(scores.textScore * 100) : fallbackSemanticSimilarity;

      const catScore = calculateCategorySimilarity(lostItem.category, foundItem.category);
      const locScore = calculateTextSimilarity(lostItem.locationLost || '', foundItem.locationFound || '');
      const dateScore = calculateDateSimilarity(lostItem.dateLost, foundItem.dateFound);

      // Determine weights dynamically
      const hasImage = !!newItem.image && !!candidate.image;
      const weights = hasImage ? config.WEIGHTS_WITH_IMAGE : config.WEIGHTS_WITHOUT_IMAGE;

      let finalScore = 0;
      if (hasImage) {
        finalScore = Math.round(
          (clipSimilarity * weights.image) +
          (semanticSimilarity * weights.semantic) +
          (catScore * weights.category) +
          (locScore * weights.location) +
          (dateScore * weights.date)
        );
      } else {
        finalScore = Math.round(
          (semanticSimilarity * weights.semantic) +
          (catScore * weights.category) +
          (locScore * weights.location) +
          (dateScore * weights.date)
        );
      }

      const aiConfidence = getConfidenceLevel(finalScore);

      if (finalScore >= config.FINAL_MATCH_THRESHOLD) {
        // Create Match in MongoDB
        const match = new Match({
          lostItem: lostItem._id,
          foundItem: foundItem._id,
          score: finalScore,
          breakdown: {
            category: catScore,
            title: semanticSimilarity, // Map semantic vector similarity to text titles
            description: semanticSimilarity,
            location: locScore,
            date: dateScore,
          },
          analytics: {
            aiConfidenceScore: finalScore,
            clipSimilarity,
            semanticSimilarity,
            similarityBreakdown: {
              imageSimilarity: clipSimilarity,
              semanticSimilarity,
              categoryMatch: catScore,
              locationMatch: locScore,
              dateMatch: dateScore,
              confidenceLevel: aiConfidence,
              embeddingVersion: config.EMBEDDING_VERSION,
              modelVersion: config.CLIP_MODEL
            }
          },
          status: 'Pending'
        });

        await match.save();
        matchCount++;

        // Generate Notifications
        await Notification.create([
          {
            recipient: lostItem.reportedBy,
            relatedMatch: match._id,
            title: 'Potential Match Found!',
            message: `We found a potential match (${finalScore}% similarity, Confidence: ${aiConfidence}) for your lost item: ${lostItem.title}.`,
          },
          {
            recipient: foundItem.reportedBy,
            relatedMatch: match._id,
            title: 'Potential Match Found!',
            message: `Your found item ${foundItem.title} might belong to someone (${finalScore}% similarity, Confidence: ${aiConfidence}).`,
          }
        ]);
      }
    }

    return { retrievedCount, matchCount };

  } catch (err) {
    console.error('Error in matchingService:', err);
    return { retrievedCount: 0, matchCount: 0 };
  }
};
