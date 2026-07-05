const express = require('express');
const router = express.Router();
const {
  createLostItem,
  getLostItems,
  getMyLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem
} = require('../controllers/lostItemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('image'), createLostItem)
  .get(protect, getLostItems);

router.route('/my-reports')
  .get(protect, getMyLostItems);

router.route('/:id')
  .get(protect, getLostItemById)
  .put(protect, upload.single('image'), updateLostItem)
  .delete(protect, deleteLostItem);

module.exports = router;
