const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/aiConfig');

const FAST_API_URL = config.AI_SERVICE_URL;

const buildTextFallbackEmbedding = (text, dimension = 384) => {
  const normalized = (text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const tokens = normalized ? normalized.split(/\s+/) : ['fallback'];
  const vector = new Array(dimension).fill(0);

  tokens.forEach((token, index) => {
    const hash = crypto.createHash('sha256').update(`${token}:${index}`).digest();
    const bucket = hash.readUInt16BE(0) % dimension;
    vector[bucket] += 0.35 + Math.min(0.65, index * 0.01);
    const bucket2 = (bucket + 17 + (index % 11)) % dimension;
    vector[bucket2] += 0.1;
  });

  const norm = Math.hypot(...vector);
  return norm > 0 ? vector.map(value => value / norm) : vector;
};

const buildImageFallbackEmbedding = (source, dimension = 512) => {
  const seed = crypto.createHash('sha256').update(source || 'fallback-image').digest();
  const vector = new Array(dimension).fill(0);

  seed.forEach((byte, index) => {
    const bucket = (index * 3 + byte) % dimension;
    vector[bucket] += byte / 255;
  });

  const norm = Math.hypot(...vector);
  return norm > 0 ? vector.map(value => value / norm) : vector;
};

/**
 * Helper to check if FastAPI service is running.
 */
const checkHealth = async () => {
  try {
    const res = await fetch(`${FAST_API_URL}/health`, { signal: AbortSignal.timeout(8000) });
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
    let blob;
    let filename;
    
    if (imagePath.startsWith('http')) {
        const imageRes = await fetch(imagePath);
        if (!imageRes.ok) throw new Error(`Failed to fetch image from URL: ${imagePath}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        filename = 'cloud_image.jpg';
    } else {
        const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const fullPath = path.join(__dirname, '..', normalizedPath);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${fullPath}`);
        }

        const fileBuffer = fs.readFileSync(fullPath);
        blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        filename = path.basename(fullPath);
    }

    const formData = new FormData();
    formData.append('file', blob, filename);

    const startTime = Date.now();
    const response = await fetch(`${FAST_API_URL}/embed-image`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI Error: ${errorText}`);
    }

    const data = await response.json();
    if (data.source && data.source !== 'clip') {
      console.warn(`⚠️  [Image Embedding] Using fallback source: "${data.source}" (real CLIP not used). Reason: ${data.error || 'unknown'}`);
    } else {
      console.log(`✅ [Image Embedding] Real CLIP embedding generated. Dimension: ${data.dimension}`);
    }
    return {
      embedding: data.embedding,
      latency: Date.now() - startTime,
      source: data.source || 'remote'
    };
  } catch (error) {
    console.warn('Falling back to local image embedding generation:', error.message);
    return {
      embedding: buildImageFallbackEmbedding(imagePath),
      latency: 0,
      source: 'fallback'
    };
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
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(120000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`FastAPI Error: ${errorText}`);
    }

    const data = await response.json();
    if (data.source && data.source !== 'sentence-transformer') {
      console.warn(`⚠️  [Text Embedding] Using fallback source: "${data.source}" (real model not used). Reason: ${data.error || 'unknown'}`);
    } else {
      console.log(`✅ [Text Embedding] Real Sentence-Transformer embedding generated. Dimension: ${data.dimension}`);
    }
    return {
      embedding: data.embedding,
      latency: Date.now() - startTime,
      source: data.source || 'remote'
    };
  } catch (error) {
    console.warn('Falling back to local text embedding generation:', error.message);
    return {
      embedding: buildTextFallbackEmbedding(text),
      latency: 0,
      source: 'fallback'
    };
  }
};

/**
 * Run EasyOCR, CLIP classification, spaCy entity extraction on the uploaded image.
 */
const processImageDocument = async (imagePath) => {
  try {
    let blob;
    let filename;
    
    if (imagePath.startsWith('http')) {
        const imageRes = await fetch(imagePath);
        if (!imageRes.ok) throw new Error(`Failed to fetch image from URL: ${imagePath}`);
        const arrayBuffer = await imageRes.arrayBuffer();
        blob = new Blob([arrayBuffer], { type: 'image/jpeg' });
        filename = 'cloud_image.jpg';
    } else {
        const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const fullPath = path.join(__dirname, '..', normalizedPath);

        if (!fs.existsSync(fullPath)) {
          throw new Error(`File not found: ${fullPath}`);
        }

        const fileBuffer = fs.readFileSync(fullPath);
        blob = new Blob([fileBuffer], { type: 'image/jpeg' });
        filename = path.basename(fullPath);
    }

    const formData = new FormData();
    formData.append('file', blob, filename);

    const startTime = Date.now();
    const response = await fetch(`${FAST_API_URL}/process-document`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120000)
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
