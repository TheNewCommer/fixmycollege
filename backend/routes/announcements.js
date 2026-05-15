const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, adminOnly } = require('../middleware/auth');

// ─── GET ALL ACTIVE ANNOUNCEMENTS (public) ────────────────
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
  }
});

// ─── CREATE ANNOUNCEMENT (admin only) ─────────────────────
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, type, expiresAt } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required.' });
    }
    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      type: type || 'info',
      postedBy: req.user._id,
      postedByName: req.user.name,
      expiresAt: expiresAt || null,
    });

    // Real-time broadcast to all students
    const io = req.app.get('io');
    io.emit('new_announcement', announcement);

    res.status(201).json({ success: true, message: 'Announcement posted!', announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to post announcement.' });
  }
});

// ─── DELETE / DEACTIVATE ANNOUNCEMENT (admin only) ────────
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!announcement) return res.status(404).json({ success: false, message: 'Announcement not found.' });
    res.json({ success: true, message: 'Announcement removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove announcement.' });
  }
});

module.exports = router;
