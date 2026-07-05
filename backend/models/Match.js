const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  lostItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LostItem',
    required: true,
  },
  foundItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoundItem',
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  breakdown: {
    category: { type: Number, required: true },
    title: { type: Number, required: true },
    description: { type: Number, required: true },
    location: { type: Number, required: true },
    date: { type: Number, required: true },
  },
  analytics: {
    aiConfidenceScore: { type: Number },
    clipSimilarity: { type: Number },
    semanticSimilarity: { type: Number },
    similarityBreakdown: { type: Object }
  },
  status: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Resolved', 'Rejected'],
    default: 'Pending',
  },
}, {
  timestamps: true,
});

// Prevent duplicate matches between the same lost and found items
matchSchema.index({ lostItem: 1, foundItem: 1 }, { unique: true });

module.exports = mongoose.model('Match', matchSchema);
