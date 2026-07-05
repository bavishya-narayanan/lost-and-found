const aiAdapter = require('./aiAdapter');

/**
 * Generate a clean semantic OCR summary based on detected entities.
 */
const buildOcrSummary = (ocrText, entities) => {
  if (!ocrText) return '';
  
  const parts = [];
  if (entities.collegeName) parts.push(`College/Institution: ${entities.collegeName}`);
  if (entities.department) parts.push(`Department: ${entities.department}`);
  if (entities.name) parts.push(`Name: ${entities.name}`);
  if (entities.rollNumber) parts.push(`Roll Number/ID: ${entities.rollNumber}`);
  if (entities.bankName) parts.push(`Bank Name: ${entities.bankName}`);
  if (entities.cardNumber) parts.push(`Card Number: ${entities.cardNumber}`);
  
  if (parts.length > 0) {
    return `OCR extracted document information: ${parts.join(', ')}.`;
  }
  
  // Fallback to a sanitized clean snippet of raw OCR text
  const cleanText = ocrText.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 150);
  return cleanText ? `OCR extracted text: ${cleanText}` : '';
};

/**
 * Orchestrate generating image embeddings, OCR, entity extraction, and text embedding.
 */
const processReport = async (title, description, hasImage, imagePath) => {
  let imageEmbedding = null;
  let ocrText = '';
  let ocrSummary = '';
  let detectedEntities = {};
  let isSensitive = false;
  
  const latencies = {
    openClip: 0,
    ocr: 0,
    sentenceTransformer: 0
  };

  // Step 1: If image exists, process document (OCR, detection) and generate OpenCLIP embedding
  if (hasImage && imagePath) {
    try {
      // Run OCR & Sensitive detection
      const docResult = await aiAdapter.processImageDocument(imagePath);
      ocrText = docResult.ocrText || '';
      detectedEntities = docResult.detectedEntities || {};
      isSensitive = docResult.isSensitive || false;
      latencies.ocr = docResult.latency || 0;

      // Build semantic summary from OCR
      ocrSummary = buildOcrSummary(ocrText, detectedEntities);

      // Generate Image Vector
      const clipResult = await aiAdapter.generateImageEmbedding(imagePath);
      imageEmbedding = clipResult.embedding;
      latencies.openClip = clipResult.latency || 0;
    } catch (err) {
      console.error('Error in embeddingPipeline image processing stage:', err);
    }
  }

  // Step 2: Combine title, description, and OCR summary, and generate Sentence Transformer embedding
  try {
    const textToEmbed = `${title} ${description} ${ocrSummary}`.trim();
    const textResult = await aiAdapter.generateTextEmbedding(textToEmbed);
    latencies.sentenceTransformer = textResult.latency || 0;
    
    return {
      imageEmbedding,
      textEmbedding: textResult.embedding,
      ocrText,
      ocrSummary,
      detectedEntities,
      isSensitive,
      latencies
    };
  } catch (err) {
    console.error('Error in embeddingPipeline text embedding stage:', err);
    throw err;
  }
};

module.exports = {
  processReport,
  buildOcrSummary
};
