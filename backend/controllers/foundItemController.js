const FoundItem = require('../models/FoundItem');
const path = require('path');
const fs = require('fs');
const aiOrchestrator = require('../services/aiOrchestrator');
const maskingUtility = require('../utils/maskingUtility');

// @desc    Create a new found report
// @route   POST /api/found-items
// @access  Private
exports.createFoundItem = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Image is required for found items' });
    }

    const { title, category, description, locationFound, dateFound, custodyType, landmark, latitude, longitude, selectedBy } = req.body;
    
    // Validate custodyType conditional fields
    if (custodyType === 'deposited') {
      if (!latitude || !longitude || !landmark) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Location coordinates and landmark are required when item is deposited' });
      }

      const locationHelper = require('../utils/locationHelper');
      if (!locationHelper.isWithinCampus(latitude, longitude)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Location must be within College of Engineering, Guindy campus boundaries' });
      }
    }

    const imagePath = `/uploads/${req.file.filename}`;

    const foundItem = new FoundItem({
      title,
      category,
      description,
      locationFound,
      dateFound,
      image: imagePath,
      custodyType,
      location: custodyType === 'deposited' ? {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        campusZone: require('../services/campusZoneService').getCampusZone(latitude, longitude),
        landmark,
        selectedBy
      } : undefined,
      locationUpdatedAt: custodyType === 'deposited' ? new Date() : undefined,
      reportedBy: req.user._id,
    });

    const savedItem = await foundItem.save();

    // Run AI orchestrator (OCR + Embeddings + Qdrant + Matching)
    const matchCount = await aiOrchestrator.processAndMatchReport(savedItem, 'found');

    res.status(201).json({
      item: savedItem,
      matchCount: matchCount || 0,
      message: matchCount > 0 
        ? `Report created! We found ${matchCount} potential match(es). Check your matches tab.`
        : `Report created successfully. No immediate matches found.`
    });
  } catch (error) {
    if (req.file) {
        // Cleanup if DB fails
        fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to create found report', error: error.message });
  }
};

// @desc    Get all active found reports
// @route   GET /api/found-items
// @access  Private
exports.getFoundItems = async (req, res) => {
  try {
    const items = await FoundItem.find({ status: 'Active' })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });
      
    // Apply dynamic masking
    const maskedItems = await Promise.all(
      items.map(item => maskingUtility.maskItem(item, req.user, 'found'))
    );
    res.json(maskedItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get logged in user's found reports
// @route   GET /api/found-items/my-reports
// @access  Private
exports.getMyFoundItems = async (req, res) => {
  try {
    const items = await FoundItem.find({ reportedBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a single found report
// @route   GET /api/found-items/:id
// @access  Private
exports.getFoundItemById = async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id)
      .populate('reportedBy', 'name email');
    
    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }
    
    // Apply dynamic masking
    const maskedItem = await maskingUtility.maskItem(item, req.user, 'found');
    res.json(maskedItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a found report
// @route   PUT /api/found-items/:id
// @access  Private
exports.updateFoundItem = async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify ownership
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to update this report' });
    }

    const { title, category, description, locationFound, dateFound, custodyType, landmark, latitude, longitude, selectedBy, status } = req.body;
    let imagePath = item.image;

    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`;
    }

    if (custodyType === 'deposited') {
      if (!latitude || !longitude || !landmark) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Location coordinates and landmark are required when item is deposited' });
      }
      
      const locationHelper = require('../utils/locationHelper');
      if (!locationHelper.isWithinCampus(latitude, longitude)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Location must be within College of Engineering, Guindy campus boundaries' });
      }
    }

    item.title = title || item.title;
    item.category = category || item.category;
    item.description = description || item.description;
    item.locationFound = locationFound || item.locationFound;
    item.dateFound = dateFound || item.dateFound;
    item.custodyType = custodyType || item.custodyType;
    
    if (item.custodyType === 'deposited') {
        if (latitude && longitude && (item.location?.latitude != latitude || item.location?.longitude != longitude)) {
            item.location = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                campusZone: require('../services/campusZoneService').getCampusZone(latitude, longitude),
                landmark: landmark || item.location?.landmark,
                selectedBy: selectedBy || item.location?.selectedBy
            };
            item.locationUpdatedAt = new Date();
        } else if (landmark) {
            if (item.location) item.location.landmark = landmark;
        }
    } else {
        item.location = undefined;
        item.locationUpdatedAt = undefined;
    }

    item.status = status || item.status;
    item.image = imagePath;

    const updatedItem = await item.save();
    res.json(updatedItem);
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Failed to update report', error: error.message });
  }
};

// @desc    Delete a found report
// @route   DELETE /api/found-items/:id
// @access  Private
exports.deleteFoundItem = async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Verify ownership
    if (item.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to delete this report' });
    }

    // Delete image
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
