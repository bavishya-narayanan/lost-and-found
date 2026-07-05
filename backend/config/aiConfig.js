module.exports = {
  // Matching Thresholds
  IMAGE_THRESHOLD: 0.60,      // Minimum cosine similarity to consider image match
  SEMANTIC_THRESHOLD: 0.50,   // Minimum cosine similarity to consider text match
  FINAL_MATCH_THRESHOLD: 40,  // Overall hybrid score threshold (0-100)
  TOP_K: 30,                  // Number of candidate vectors to fetch from Qdrant

  // Dynamic weights
  WEIGHTS_WITH_IMAGE: {
    image: 0.45,
    semantic: 0.35,
    category: 0.10,
    location: 0.05,
    date: 0.05
  },

  WEIGHTS_WITHOUT_IMAGE: {
    semantic: 0.70,
    category: 0.15,
    location: 0.10,
    date: 0.05
  },

  // Version Metadata
  EMBEDDING_VERSION: 'v1',
  CLIP_MODEL: 'ViT-B-32 (OpenCLIP)',
  SENTENCE_MODEL: 'all-MiniLM-L6-v2',

  // Qdrant Config
  QDRANT_URL: process.env.QDRANT_URL || 'http://localhost:6333',

  // FastAPI Config
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000'
};
