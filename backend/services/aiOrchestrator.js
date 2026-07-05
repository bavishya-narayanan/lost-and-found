const embeddingPipeline = require('./embeddingPipeline');
const qdrantService = require('./qdrantService');
const matchingService = require('./matchingService');
const AiAnalytics = require('../models/AiAnalytics');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Match = require('../models/Match');
const Notification = require('../models/Notification');
const aiAdapter = require('./aiAdapter');
const config = require('../config/aiConfig');

// ── Fallback: keyword similarity (Jaccard) ───────────────────
const jaccardSimilarity = (a = '', b = '') => {
  const tokenize = s => new Set(s.toLowerCase().split(/\W+/).filter(Boolean));
  const s1 = tokenize(a);
  const s2 = tokenize(b);
  let intersection = 0;
  for (const t of s1) if (s2.has(t)) intersection++;
  const union = new Set([...s1, ...s2]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
};

const dateSimilarity = (d1, d2) => {
  if (!d1 || !d2) return 50;
  const diffDays = Math.abs(new Date(d1) - new Date(d2)) / 86400000;
  return Math.max(0, 100 - diffDays * 10);
};

/**
 * Fallback matcher — runs when FastAPI is offline.
 * Uses keyword/Jaccard overlap on title, description, category, location.
 */
const fallbackMatch = async (newItem, itemType) => {
  const isLost = itemType === 'lost';
  const targetModel = isLost ? FoundItem : LostItem;

  console.log(`[AI Orchestrator] ⚡ FastAPI offline — running fallback keyword matcher for ${itemType} report ${newItem._id}`);

  const opposites = await targetModel.find({ status: 'Active' });
  let matchCount = 0;

  for (const candidate of opposites) {
    const lostItem  = isLost ? newItem : candidate;
    const foundItem = isLost ? candidate : newItem;

    // Skip same user
    if (lostItem.reportedBy.toString() === foundItem.reportedBy.toString()) continue;

    // Skip existing matches
    const existing = await Match.findOne({ lostItem: lostItem._id, foundItem: foundItem._id });
    if (existing) continue;

    // Score components
    const titleScore    = jaccardSimilarity(lostItem.title, foundItem.title);
    const descScore     = jaccardSimilarity(lostItem.description, foundItem.description);
    const catScore      = lostItem.category?.toLowerCase() === foundItem.category?.toLowerCase() ? 100 : 0;
    const locScore      = jaccardSimilarity(lostItem.locationLost || '', foundItem.locationFound || '');
    const dateScore     = dateSimilarity(lostItem.dateLost, foundItem.dateFound);

    // Weights (no image in fallback)
    const w = config.WEIGHTS_WITHOUT_IMAGE;
    const semanticSim = Math.round((titleScore * 0.5) + (descScore * 0.5));
    const finalScore = Math.round(
      (semanticSim  * w.semantic) +
      (catScore     * w.category) +
      (locScore     * w.location) +
      (dateScore    * w.date)
    );

    if (finalScore >= config.FINAL_MATCH_THRESHOLD) {
      const confidenceLevel = finalScore >= 95 ? 'Very High' : finalScore >= 90 ? 'High' : finalScore >= 80 ? 'Medium' : 'Low';
      const match = await Match.create({
        lostItem:  lostItem._id,
        foundItem: foundItem._id,
        score:     finalScore,
        breakdown: { category: catScore, title: titleScore, description: descScore, location: locScore, date: dateScore },
        analytics: {
          aiConfidenceScore: finalScore,
          clipSimilarity: 0,
          semanticSimilarity: semanticSim,
          similarityBreakdown: {
            imageSimilarity: 0, semanticSimilarity: semanticSim,
            categoryMatch: catScore, locationMatch: locScore, dateMatch: dateScore,
            confidenceLevel, embeddingVersion: 'fallback-keyword', modelVersion: 'keyword-jaccard'
          }
        },
        status: 'Pending'
      });
      matchCount++;

      await Notification.create([
        {
          recipient: lostItem.reportedBy,
          relatedMatch: match._id,
          title: 'Potential Match Found!',
          message: `We found a potential match (${finalScore}% similarity, Confidence: ${confidenceLevel}) for your lost item: ${lostItem.title}.`,
        },
        {
          recipient: foundItem.reportedBy,
          relatedMatch: match._id,
          title: 'Potential Match Found!',
          message: `Your found item "${foundItem.title}" might belong to someone (${finalScore}% similarity, Confidence: ${confidenceLevel}).`,
        }
      ]);
    }
  }

  console.log(`[AI Orchestrator] ⚡ Fallback matching done — created ${matchCount} matches.`);
  return matchCount;
};

/**
 * Helper to normalize raw user location into a standard campus zone.
 */
const normalizeCampusZone = (location) => {
  if (!location) return 'Unknown';
  const loc = location.toLowerCase();
  if (loc.includes('it block') || loc.includes('it dept') || loc.includes('information tech') || loc.includes('computer')) return 'IT Block';
  if (loc.includes('library') || loc.includes('reading room') || loc.includes('study')) return 'Main Library';
  if (loc.includes('science') || loc.includes('physics') || loc.includes('chemistry') || loc.includes('biology') || loc.includes('lab')) return 'Science Block';
  if (loc.includes('hostel') || loc.includes('mess') || loc.includes('dorm') || loc.includes('canteen')) return 'Hostel Zone';
  if (loc.includes('sports') || loc.includes('ground') || loc.includes('gym') || loc.includes('stadium') || loc.includes('court') || loc.includes('field')) return 'Sports Complex';
  if (loc.includes('admin') || loc.includes('office') || loc.includes('registrar') || loc.includes('main building') || loc.includes('dean')) return 'Admin Block';
  return 'Unknown';
};

/**
 * Main orchestrator method to run OCR/Embedding generation, save to Qdrant, run retrieve-and-re-rank, and log metrics.
 */
const processAndMatchReport = async (item, itemType) => {
  const overallStart = Date.now();
  const isLost = itemType === 'lost';
  const modelClass = isLost ? LostItem : FoundItem;

  let ocrTime = 0;
  let openClipTime = 0;
  let sentenceTransformerTime = 0;
  let totalMatchingTime = 0;
  let retrievedCount = 0;
  let finalMatchesCount = 0;

  try {
    // Prefer the embedding pipeline even when the remote AI service is temporarily unavailable.
    // The adapter already has local fallback logic for text/image embeddings, so we should not
    // skip Qdrant ingestion and matching just because the remote service is down.
    const aiOnline = await aiAdapter.checkHealth();
    if (!aiOnline) {
      console.warn(`[AI Orchestrator] ⚠️  FastAPI health check failed — continuing with local embedding fallbacks.`);
    }

    const hasImage = !!item.image;
    const locationStr = isLost ? item.locationLost : item.locationFound;
    const campusZone = normalizeCampusZone(locationStr);

    console.log(`[AI Orchestrator] Processing ${itemType} report: ${item._id} (Category: ${item.category}, Zone: ${campusZone}, Image: ${hasImage})`);

    // 1. Run the embedding & OCR pipeline via FastAPI
    const pipelineResult = await embeddingPipeline.processReport(
      item.title,
      item.description,
      hasImage,
      item.image
    );

    ocrTime = pipelineResult.latencies.ocr;
    openClipTime = pipelineResult.latencies.openClip;
    sentenceTransformerTime = pipelineResult.latencies.sentenceTransformer;

    // 2. Save OCR text & classification details to MongoDB
    await modelClass.findByIdAndUpdate(item._id, {
      isSensitive: pipelineResult.isSensitive,
      ocrText: pipelineResult.ocrText,
      ocrSummary: pipelineResult.ocrSummary,
      detectedEntities: pipelineResult.detectedEntities,
      campusZone: campusZone // Store standardized zone in MongoDB for completeness
    });

    // Update local item object fields
    item.isSensitive = pipelineResult.isSensitive;
    item.ocrText = pipelineResult.ocrText;
    item.ocrSummary = pipelineResult.ocrSummary;
    item.detectedEntities = pipelineResult.detectedEntities;

    // 3. Store text embedding vector in Qdrant
    const payload = {
      reportId: item._id.toString(),
      reportType: isLost ? 'Lost' : 'Found',
      status: item.status || 'Active',
      category: item.category,
      campusZone,
      createdDate: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
      hasImage,
      isSensitive: pipelineResult.isSensitive
    };

    await qdrantService.upsertVector(
      'text_embeddings',
      item._id,
      pipelineResult.textEmbedding,
      payload
    );

    // 4. Store image embedding vector in Qdrant (if available)
    if (hasImage && pipelineResult.imageEmbedding) {
      await qdrantService.upsertVector(
        'image_embeddings',
        item._id,
        pipelineResult.imageEmbedding,
        payload
      );
    }

    // 5. Trigger retrieve-and-re-rank matching pipeline
    const matchStart = Date.now();
    const matchResults = await matchingService.findMatches(
      item,
      itemType,
      pipelineResult.textEmbedding,
      pipelineResult.imageEmbedding,
      campusZone
    );
    totalMatchingTime = Date.now() - matchStart;

    if (matchResults) {
      retrievedCount = matchResults.retrievedCount || 0;
      finalMatchesCount = matchResults.matchCount || 0;
    }

    // 6. Log execution statistics to AI Analytics collection
    const overallEnd = Date.now();
    await AiAnalytics.create({
      reportId: item._id,
      reportTypeModel: isLost ? 'LostItem' : 'FoundItem',
      processingTime: overallEnd - overallStart,
      openClipTime,
      ocrTime,
      sentenceTransformerTime,
      totalMatchingTime,
      retrievedCandidatesCount: retrievedCount,
      finalMatchCount: finalMatchesCount
    });

    console.log(`[AI Orchestrator] ✅ Completed ${itemType} report in ${overallEnd - overallStart}ms. Created ${finalMatchesCount} AI matches.`);

  } catch (error) {
    console.error(`[AI Orchestrator] Error processing report ${item._id}:`, error.message);
    // Last-resort fallback for unexpected pipeline failures.
    try {
      console.warn(`[AI Orchestrator] Attempting fallback keyword matching...`);
      await fallbackMatch(item, itemType);
    } catch (fallbackErr) {
      console.error(`[AI Orchestrator] Fallback also failed:`, fallbackErr.message);
    }
  }
};

module.exports = {
  processAndMatchReport,
  normalizeCampusZone
};
