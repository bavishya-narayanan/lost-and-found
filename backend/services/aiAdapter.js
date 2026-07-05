const fs = require('fs');
const path = require('path');
const config = require('../config/aiConfig');

const FAST_API_URL = config.AI_SERVICE_URL;

/**
 * Helper to check if FastAPI service is running.
 */
const checkHealth = async () => {
  try {
    const res = await fetch(`${FAST_API_URL}/health`, { signal: AbortSignal.timeout(1000) });
    return res.ok;
  } catch (err) {
    return false;
  }
};

/**
 * Generate 512-dimension image embedding from OpenCLIP.
 */
const generateImageEmbedding = async (imagePath) => {
  try {
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullPath = path.join(__dirname, '..', normalizedPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, path.basename(fullPath));

    const startTime = Date.now();
    const response = await fetch(`${FAST_API_URL}/embed-image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI Error: ${errorText}`);
    }

    const data = await response.json();
    return {
      embedding: data.embedding,
      latency: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error generating image embedding:', error);
    throw error;
  }
};

/**
 * Generate 384-dimension text embedding from Sentence Transformer.
 */
const generateTextEmbedding = async (text) => {
  try {
    const startTime = Date.now();
    const response = await fetch(`${FAST_API_URL}/embed-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI Error: ${errorText}`);
    }

    const data = await response.json();
    return {
      embedding: data.embedding,
      latency: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error generating text embedding:', error);
    throw error;
  }
};

/**
 * Run EasyOCR, CLIP classification, spaCy entity extraction on the uploaded image.
 */
const processImageDocument = async (imagePath) => {
  try {
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    const fullPath = path.join(__dirname, '..', normalizedPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', blob, path.basename(fullPath));

    const startTime = Date.now();
    const response = await fetch(`${FAST_API_URL}/process-document`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI Error: ${errorText}`);
    }

    const data = await response.json();
    return {
      isSensitive: data.isSensitive,
      ocrText: data.ocrText,
      detectedEntities: data.detectedEntities,
      latency: Date.now() - startTime
    };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
};

module.exports = {
  checkHealth,
  generateImageEmbedding,
  generateTextEmbedding,
  processImageDocument
};
