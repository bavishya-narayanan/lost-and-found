const Match = require('../models/Match');

// @desc    Get user's matches
// @route   GET /api/matches/my-matches
// @access  Private
exports.getMyMatches = async (req, res) => {
  try {
    // A match belongs to the user if they reported either the lostItem or the foundItem
    const matches = await Match.find()
      .populate('lostItem')
      .populate('foundItem')
      .sort({ createdAt: -1 });

    // Filter matches belonging to user
    const myMatches = matches.filter(match => {
      return (match.lostItem && match.lostItem.reportedBy.toString() === req.user._id.toString()) ||
             (match.foundItem && match.foundItem.reportedBy.toString() === req.user._id.toString());
    });

    res.json(myMatches);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch matches', error: error.message });
  }
};

// @desc    Get a single match detail
// @route   GET /api/matches/:id
// @access  Private
exports.getMatchDetails = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('lostItem')
      .populate('foundItem');
      
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Verify ownership
    if (match.lostItem.reportedBy.toString() !== req.user._id.toString() && 
        match.foundItem.reportedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this match' });
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch match details', error: error.message });
  }
};
