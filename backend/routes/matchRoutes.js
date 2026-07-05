const express = require('express');
const router = express.Router();
const { getMyMatches, getMatchDetails } = require('../controllers/matchController');
const { protect } = require('../middleware/authMiddleware');

router.route('/my-matches')
  .get(protect, getMyMatches);

router.route('/:id')
  .get(protect, getMatchDetails);

module.exports = router;
