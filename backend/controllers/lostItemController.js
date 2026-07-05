const LostItem = require('../models/LostItem');
const path = require('path');
const fs = require('fs');
const aiOrchestrator = require('../services/aiOrchestrator');
const maskingUtility = require('../utils/maskingUtility');

// @desc    Create a new lost report
// @route   POST /api/lost-items
// @access  Private
exports.createLostItem = async (req, res) => {
  try {
    const { title, category, description, locationLost, dateLost } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    const lostItem = new LostItem({
      title,
      category,
      description,
      locationLost,
      dateLost,
      image: imagePath,
      reportedBy: req.user._id,
    });

    const savedItem = await lostItem.save();

    // Run AI orchestrator (OCR + Embeddings + Qdrant + Matching)
    const matchCount = await aiOrchestrator.processAndMatchReport(savedItem, 'lost');

    res.status(201).json({
      item: savedItem,
      matchCount: matchCount || 0,
      message: matchCount > 0 
        ? `Report created! We found ${matchCount} potential match(es). Check your matches tab.`
        : `Report created successfully. No immediate matches found.`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create lost report', error: error.message });
  }
};

// @desc    Get all active lost reports (Dashboard/Feed)
// @route   GET /api/lost-items
// @access  Private
exports.getLostItems = async (req, res) => {
  try {
    const items = await LostItem.find({ status: 'Active' })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
      
    // Apply dynamic masking
    const maskedItems = await Promise.all(
      items.map(item => maskingUtility.maskItem(item, req.user, 'lost'))
    );
    res.json(maskedItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user's lost reports
// @route   GET /api/lost-items/my-reports
// @access  Private
exports.getMyLostItems = async (req, res) => {
  try {
    const items = await LostItem.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single lost report
// @route   GET /api/lost-items/:id
// @access  Private
exports.getLostItemById = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id)
      .populate('reportedBy', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Apply dynamic masking
    const maskedItem = await maskingUtility.maskItem(item, req.user, 'lost');
    res.json(maskedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a lost report
// @route   PUT /api/lost-items/:id
// @access  Private
exports.updateLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify ownership
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this report' });
    }

    const { title, category, description, locationLost, dateLost, status } = req.body;
    let imagePath = item.image;

    if (req.file) {
      // If a new image is uploaded, we could optionally delete the old one here
      imagePath = `/uploads/${req.file.filename}`;
    }

    item.title = title || item.title;
    item.category = category || item.category;
    item.description = description || item.description;
    item.locationLost = locationLost || item.locationLost;
    item.dateLost = dateLost || item.dateLost;
    item.status = status || item.status;
    item.image = imagePath;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update report', error: error.message });
  }
};

// @desc    Delete a lost report
// @route   DELETE /api/lost-items/:id
// @access  Private
exports.deleteLostItem = async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify ownership
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this report' });
    }

    // Delete image if it exists
    if (item.image) {
      const filePath = path.join(__dirname, '..', item.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await item.deleteOne();
    res.json({ message: 'Report removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
