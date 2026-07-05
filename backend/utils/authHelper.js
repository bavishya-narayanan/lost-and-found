const Match = require('../models/Match');
const RecoverySession = require('../models/RecoverySession');

exports.canAccessOriginalData = async (userId, matchId) => {
  if (!matchId) return false;

  const match = await Match.findById(matchId).populate('lostItem').populate('foundItem');
  if (!match) return false;

  const isOwner = match.lostItem.reportedBy.toString() === userId.toString();
  const isFinder = match.foundItem.reportedBy.toString() === userId.toString();

  return isOwner || isFinder;
};

exports.isParticipantInSession = async (userId, sessionId) => {
  const session = await RecoverySession.findById(sessionId);
  if (!session) return false;
  
  return session.owner.toString() === userId.toString() || session.finder.toString() === userId.toString();
};
