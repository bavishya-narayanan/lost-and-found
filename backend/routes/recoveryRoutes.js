const express = require('express');
const router = express.Router();
const recoveryController = require('../controllers/recoveryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/start/:matchId', recoveryController.startRecovery);
router.post('/accept-contact/:sessionId', recoveryController.acceptContact);
router.get('/verification-questions/:sessionId', recoveryController.getVerificationQuestions);
router.post('/submit-verification/:sessionId', recoveryController.submitVerification);
router.post('/approve-verification/:sessionId', recoveryController.approveVerification);
router.post('/complete/:sessionId', recoveryController.completeRecovery);
router.get('/session/:matchId', recoveryController.getSession);

module.exports = router;
