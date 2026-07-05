const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const maskingUtility = require('../utils/maskingUtility');

// @desc    Search and filter reports (Browse Items)
// @route   GET /api/search
// @access  Private
exports.searchReports = async (req, res) => {
  try {
    const { query, category, status, type, location, startDate, endDate } = req.query;
    
    // Build filter objects
    let lostFilter = { status: 'Active' };
    let foundFilter = { status: 'Active' };

    if (status) {
      lostFilter.status = status;
      foundFilter.status = status;
    }

    if (category) {
      lostFilter.category = category;
      foundFilter.category = category;
    }

    // Text search on title, description, location (Basic regex for now)
    if (query) {
      const regex = new RegExp(query, 'i');
      const textQuery = { $or: [{ title: regex }, { description: regex }] };
      lostFilter = { ...lostFilter, ...textQuery };
      foundFilter = { ...foundFilter, ...textQuery };
    }

    if (location) {
      const locRegex = new RegExp(location, 'i');
      lostFilter.locationLost = locRegex;
      foundFilter.locationFound = locRegex;
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      lostFilter.dateLost = dateFilter;
      foundFilter.dateFound = dateFilter;
    }

    let results = [];

    if (!type || type === 'lost') {
      const lost = await LostItem.find(lostFilter)
        .populate('reportedBy', 'name')
        .lean();
      // Add a type flag
      lost.forEach(item => { item.type = 'lost'; item.date = item.dateLost; });
      results = results.concat(lost);
    }

    if (!type || type === 'found') {
      const found = await FoundItem.find(foundFilter)
        .populate('reportedBy', 'name')
        .lean();
      found.forEach(item => { item.type = 'found'; item.date = item.dateFound; });
      results = results.concat(found);
    }

    // Sort by most recent
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply dynamic masking
    const maskedResults = await Promise.all(
      results.map(item => maskingUtility.maskItem(item, req.user, item.type))
    );

    res.json(maskedResults);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
};
