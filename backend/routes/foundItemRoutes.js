const express = require('express');
const router = express.Router();
const {
  createFoundItem,
  getFoundItems,
  getMyFoundItems,
  getFoundItemById,
  updateFoundItem,
  deleteFoundItem
} = require('../controllers/foundItemController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .post(protect, upload.single('image'), createFoundItem)
  .get(protect, getFoundItems);

router.route('/my-reports')
  .get(protect, getMyFoundItems);

router.route('/:id')
  .get(protect, getFoundItemById)
  .put(protect, upload.single('image'), updateFoundItem)
  .delete(protect, deleteFoundItem);

module.exports = router;
