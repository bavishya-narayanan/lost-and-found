const mongoose = require('mongoose');

const recoverySessionSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  finder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Contact Requested', 'Contact Accepted', 'Verification Pending', 'Recovered', 'Closed'],
    default: 'Active',
  },
  verification: {
    questions: { type: Array, default: [] },
    answers: { type: Object, default: {} },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
  },
  timeline: [{
    event: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  sessionTimestamps: {
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  metrics: {
    recoveryDuration: { type: Number },
    successMetrics: { type: Object }
  },
  meetingLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    campusZone: { type: String },
    landmark: { type: String },
    selectedBy: { type: String, enum: ['GPS', 'MAP'] }
  },
  meetingLocationUpdatedAt: {
    type: Date
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('RecoverySession', recoverySessionSchema);
