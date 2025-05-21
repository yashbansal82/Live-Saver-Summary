const express = require('express');
const router = express.Router();
const Link = require('../models/Link');
const { generateSummary } = require('../utils/summaryGenerator');
const auth = require('../middleware/auth');

// Get all links for a user
router.get('/', auth, async (req, res) => {
  try {
    const links = await Link.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(links);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Save a new link with auto-summary
router.post('/', auth, async (req, res) => {
  try {
    const { url, title } = req.body;
    
    // Generate summary
    const summary = await generateSummary(url);
    
    const link = new Link({
      url,
      title,
      summary,
      user: req.user.id
    });

    await link.save();
    res.status(201).json(link);
  } catch (error) {
    console.error('Error saving link:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate summary for an existing link
router.post('/:id/summary', auth, async (req, res) => {
  try {
    const link = await Link.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    const summary = await generateSummary(link.url);
    link.summary = summary;
    await link.save();

    res.json(link);
  } catch (error) {
    console.error('Error generating summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a link
router.delete('/:id', auth, async (req, res) => {
  try {
    const link = await Link.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!link) {
      return res.status(404).json({ message: 'Link not found' });
    }

    res.json({ message: 'Link deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 