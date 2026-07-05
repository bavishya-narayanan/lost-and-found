const mongoose = require('mongoose');

const aiAnalyticsSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'reportTypeModel',
    required: true
  },
  reportTypeModel: {
    type: String,
    required: true,
    enum: ['LostItem', 'FoundItem']
  },
  processingTime: { type: Number, required: true }, // Total execution time in ms
  openClipTime: { type: Number, default: 0 },       // Time spent on OpenCLIP embedding in ms
  ocrTime: { type: Number, default: 0 },            // Time spent on EasyOCR in ms
  sentenceTransformerTime: { type: Number, default: 0 }, // Time spent on Sentence Transformer in ms
  totalMatchingTime: { type: Number, default: 0 },  // Time spent fetching and re-ranking matches in ms
  retrievedCandidatesCount: { type: Number, default: 0 }, // Qdrant retrieved candidates
  finalMatchCount: { type: Number, default: 0 },    // Count of matches above final threshold
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AiAnalytics', aiAnalyticsSchema);
