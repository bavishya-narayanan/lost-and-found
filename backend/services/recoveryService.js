const mongoose = require('mongoose');
const Match = require('../models/Match');
const RecoverySession = require('../models/RecoverySession');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const notificationService = require('./notificationService');
const chatService = require('./chatService');
const verificationTemplates = require('../config/verificationTemplates');

const appendTimelineEvent = async (session, eventStr) => {
  session.timeline.push({ event: eventStr, timestamp: new Date() });
};

exports.startRecovery = async (matchId, userId) => {
  const match = await Match.findById(matchId).populate('lostItem').populate('foundItem');
  if (!match) throw new Error('Match not found');

  const ownerId = match.lostItem.reportedBy;
  const finderId = match.foundItem.reportedBy;

  if (ownerId.toString() !== userId.toString()) {
    throw new Error('Only the owner can start recovery');
  }

  let session = await RecoverySession.findOne({ matchId });
  if (session) return session;

  const custodyType = match.foundItem.custodyType;

  session = new RecoverySession({
    matchId,
    owner: ownerId,
    finder: finderId,
    status: custodyType === 'deposited' ? 'Active' : 'Contact Requested',
    sessionTimestamps: { startedAt: new Date() }
  });

  await appendTimelineEvent(session, 'Match Created');
  await appendTimelineEvent(session, 'Recovery Started');

  if (custodyType === 'deposited') {
    await notificationService.createNotification(
      finderId, matchId, 'GENERAL', 'Recovery Started', 'The owner has initiated recovery for the deposited item.'
    );
  } else {
    await appendTimelineEvent(session, 'Contact Requested');
    await notificationService.createNotification(
      finderId, matchId, 'CONTACT_REQUEST', 'Contact Requested', 'The owner wants to contact you regarding the found item.'
    );
  }

  await session.save();
  return session;
};

exports.acceptContact = async (sessionId, userId) => {
  const session = await RecoverySession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  if (session.finder.toString() !== userId.toString()) {
    throw new Error('Only finder can accept contact request');
  }

  if (session.status !== 'Contact Requested') {
    throw new Error('Invalid state transition');
  }

  session.status = 'Contact Accepted';
  await appendTimelineEvent(session, 'Contact Accepted');

  await notificationService.createNotification(
    session.owner, session.matchId, 'CONTACT_ACCEPTED', 'Contact Accepted', 'The finder has accepted your contact request. You can now chat.'
  );

  await chatService.saveMessage(session._id, null, null, 'system', 'Contact request accepted. You can now chat.');

  await session.save();
  return session;
};

exports.submitVerification = async (sessionId, userId, answers) => {
  const session = await RecoverySession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  if (session.owner.toString() !== userId.toString()) {
    throw new Error('Only owner can submit verification answers');
  }

  session.status = 'Verification Pending';
  session.verification.answers = answers;
  session.verification.status = 'Pending';
  
  await appendTimelineEvent(session, 'Verification Submitted');
  
  await notificationService.createNotification(
    session.finder, session.matchId, 'VERIFICATION_REQUIRED', 'Verification Submitted', 'The owner has submitted verification answers for your review.'
  );

  await chatService.saveMessage(session._id, null, null, 'system', 'Verification answers submitted by owner.');

  await session.save();
  return session;
};

exports.approveVerification = async (sessionId, userId) => {
  const session = await RecoverySession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  if (session.finder.toString() !== userId.toString()) {
    throw new Error('Only finder can approve verification');
  }

  session.verification.status = 'Approved';
  await appendTimelineEvent(session, 'Verification Approved');

  await notificationService.createNotification(
    session.owner, session.matchId, 'GENERAL', 'Verification Approved', 'Your verification has been approved.'
  );

  await chatService.saveMessage(session._id, null, null, 'system', 'Verification approved.');

  await session.save();
  return session;
};

exports.completeRecovery = async (sessionId, userId) => {
  const session = await RecoverySession.findById(sessionId);
  if (!session) throw new Error('Session not found');

  if (session.owner.toString() !== userId.toString() && session.finder.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  try {
    session.status = 'Recovered';
    session.sessionTimestamps = session.sessionTimestamps || {};
    session.sessionTimestamps.completedAt = new Date();
    if (session.sessionTimestamps.startedAt) {
      const durationMs = session.sessionTimestamps.completedAt.getTime() - session.sessionTimestamps.startedAt.getTime();
      session.metrics = session.metrics || {};
      session.metrics.recoveryDuration = durationMs;
    }

    await appendTimelineEvent(session, 'Recovery Completed');
    await session.save();

    const match = await Match.findById(session.matchId);
    match.status = 'Resolved';
    await match.save();

    const lostItem = await LostItem.findById(match.lostItem);
    lostItem.status = 'Resolved';
    await lostItem.save();

    const foundItem = await FoundItem.findById(match.foundItem);
    foundItem.status = 'Resolved';
    await foundItem.save();

    await notificationService.createNotification(
      session.owner, session.matchId, 'RECOVERY_COMPLETED', 'Recovery Completed', 'The item has been successfully recovered.'
    );
    await notificationService.createNotification(
      session.finder, session.matchId, 'RECOVERY_COMPLETED', 'Recovery Completed', 'The item has been successfully recovered.'
    );

    await chatService.saveMessage(session._id, null, null, 'system', 'Recovery completed successfully.');

    return session;
  } catch (error) {
    throw error;
  }
};

exports.getVerificationQuestions = async (sessionId) => {
  const session = await RecoverySession.findById(sessionId).populate({
    path: 'matchId',
    populate: { path: 'lostItem' }
  });
  if (!session) throw new Error('Session not found');
  
  const category = session.matchId.lostItem.category;
  const questions = verificationTemplates[category] || verificationTemplates['Default'];
  
  session.verification.questions = questions;
  await session.save();
  return questions;
};
