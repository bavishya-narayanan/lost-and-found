const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  locationLost: {
    type: String,
    required: [true, 'Location lost is required'],
  },
  dateLost: {
    type: Date,
    required: [true, 'Date lost is required'],
  },
  image: {
    type: String, // Optional
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved'],
    default: 'Active',
  },
  isSensitive: {
    type: Boolean,
    default: false,
  },
  ocrText: {
    type: String,
    default: '',
  },
  ocrSummary: {
    type: String,
    default: '',
  },
  detectedEntities: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  campusZone: {
    type: String,
    default: 'Unknown',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LostItem', lostItemSchema);
