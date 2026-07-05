const chatService = require('../services/chatService');
const authHelper = require('../utils/authHelper');
const RecoverySession = require('../models/RecoverySession');

exports.getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const isParticipant = await authHelper.isParticipantInSession(req.user.id, sessionId);
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized for this session' });
    }

    const session = await RecoverySession.findById(sessionId);
    if (!session || (session.status !== 'Contact Accepted' && session.status !== 'Verification Pending' && session.status !== 'Recovered')) {
       return res.status(403).json({ success: false, message: 'Chat not available for this session state' });
    }

    const messages = await chatService.getMessages(sessionId);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
