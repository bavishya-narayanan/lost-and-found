const recoveryService = require('../services/recoveryService');

exports.startRecovery = async (req, res) => {
  try {
    const session = await recoveryService.startRecovery(req.params.matchId, req.user.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.acceptContact = async (req, res) => {
  try {
    const session = await recoveryService.acceptContact(req.params.sessionId, req.user.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.submitVerification = async (req, res) => {
  try {
    const session = await recoveryService.submitVerification(req.params.sessionId, req.user.id, req.body.answers);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveVerification = async (req, res) => {
  try {
    const session = await recoveryService.approveVerification(req.params.sessionId, req.user.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.completeRecovery = async (req, res) => {
  try {
    const session = await recoveryService.completeRecovery(req.params.sessionId, req.user.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getVerificationQuestions = async (req, res) => {
  try {
    const questions = await recoveryService.getVerificationQuestions(req.params.sessionId);
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getSession = async (req, res) => {
  try {
    const RecoverySession = require('../models/RecoverySession');
    const session = await RecoverySession.findOne({ matchId: req.params.matchId }).populate('owner').populate('finder');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}
