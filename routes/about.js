const express = require('express');
const router = express.Router();
const About = require('../models/About');
const auth = require('../middleware/auth');

// GET /api/about — get about content (public)
router.get('/', async (req, res) => {
  try {
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About content not found' });
    res.json(about);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/about — create about content (admin only)
router.post('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    // only one about document allowed
    const existing = await About.findOne();
    if (existing) {
      existing.content = content;
      existing.updatedAt = Date.now();
      await existing.save();
      return res.json(existing);
    }
    const about = new About({ content });
    await about.save();
    res.status(201).json(about);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/about — update about content (admin only)
router.put('/', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const about = await About.findOne();
    if (!about) return res.status(404).json({ message: 'About content not found' });
    about.content = content;
    about.updatedAt = Date.now();
    await about.save();
    res.json(about);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;