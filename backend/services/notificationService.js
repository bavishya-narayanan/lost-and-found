const Notification = require('../models/Notification');

exports.createNotification = async (recipientId, matchId, type, title, message) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      relatedMatch: matchId,
      type,
      title,
      message,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
