const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  relatedMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  readStatus: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['CONTACT_REQUEST', 'CONTACT_ACCEPTED', 'CONTACT_REJECTED', 'NEW_MESSAGE', 'VERIFICATION_REQUIRED', 'RECOVERY_COMPLETED', 'MATCH_FOUND', 'GENERAL'],
    default: 'GENERAL',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Notification', notificationSchema);
