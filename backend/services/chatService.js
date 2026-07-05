const Message = require('../models/Message');

exports.saveMessage = async (sessionId, senderId, receiverId, messageType, content) => {
  try {
    const message = new Message({
      recoverySessionId: sessionId,
      sender: senderId,
      receiver: receiverId,
      messageType,
      content
    });
    await message.save();
    return message;
  } catch (error) {
    console.error('Error saving message:', error);
    throw error;
  }
};

exports.getMessages = async (sessionId) => {
  return await Message.find({ recoverySessionId: sessionId }).sort({ createdAt: 1 });
};
