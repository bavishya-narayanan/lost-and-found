const express = require('express');
const router = express.Router();
const { searchReports } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, searchReports);

module.exports = router;
