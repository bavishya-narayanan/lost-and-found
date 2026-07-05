const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  recoverySessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoverySession',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  messageType: {
    type: String,
    enum: ['text', 'system', 'image'],
    default: 'text',
  },
  content: {
    type: String,
    required: true,
  },
  seenStatus: {
    type: Boolean,
    default: false,
  },
  deliveryStatus: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Message', messageSchema);
