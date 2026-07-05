const mongoose = require('mongoose');

const foundItemSchema = new mongoose.Schema({
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
  locationFound: {
    type: String,
    required: [true, 'Location found is required'],
  },
  dateFound: {
    type: Date,
    required: [true, 'Date found is required'],
  },
  image: {
    type: String,
    required: [true, 'Image is required for found items'],
  },
  custodyType: {
    type: String,
    enum: ['holding', 'deposited'],
    required: [true, 'Custody type is required'],
  },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    campusZone: { type: String },
    landmark: { type: String },
    selectedBy: { type: String, enum: ['GPS', 'MAP'] }
  },
  locationUpdatedAt: {
    type: Date
  },
  // Deprecated legacy fields, kept for backward compatibility if needed, but replaced by location object
  currentLocation: {
    type: String,
  },
  landmark: {
    type: String,
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

module.exports = mongoose.model('FoundItem', foundItemSchema);
