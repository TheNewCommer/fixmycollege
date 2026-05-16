const express = require('express');
const router = express.Router();
const Wellbeing = require('../models/Wellbeing');
const { protect, optionalAuth, raggingAdminOnly, adminOnly } = require('../middleware/auth');
const { notifyRaggingAdmin, notifySuperAdmin } = require('../utils/sms');

// ─── CREATE POST ──────────────────────────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { category, content, feeling } = req.body;
    if (!category || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Category and content are required.' });
    }

    const post = await Wellbeing.create({
      category,
      content: content.trim(),
      feeling: feeling || null,
      author: req.user ? req.user._id : null,
    });

    // Handle ragging — SMS only to private admin
    if (category === 'ragging') {
      await notifyRaggingAdmin(post);
      await notifySuperAdmin(`A ragging report has been submitted. Check ragging dashboard immediately.`);
      post.smsSent = true;
      await post.save();
      // Never return ragging post to public
      return res.status(201).json({
        success: true,
        message: 'Your report has been submitted confidentially. The concerned authority has been notified immediately.',
      });
    }

    // Emit real-time for peer support wall
    const io = req.app.get('io');
    io.emit('new_wellbeing_post', {
      _id: post._id,
      category: post.category,
      feeling: post.feeling,
      createdAt: post.createdAt,
    });

    res.status(201).json({
      success: true,
      message: 'Posted successfully!',
      post,
    });
  } catch (err) {
    console.error('Wellbeing post error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit. Please try again.' });
  }
});

// ─── GET POSTS (public — excluding ragging) ───────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const filter = { isPrivate: false };
    if (category && category !== 'ragging') filter.category = category;
    // Exclude ragging from public feed always
    filter.category = { $ne: 'ragging', ...(category && category !== 'ragging' ? { $eq: category } : {}) };

    // Simplified filter
    const publicFilter = { isPrivate: false };
    if (category && category !== 'ragging') publicFilter.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Wellbeing.countDocuments(publicFilter);
    const posts = await Wellbeing.find(publicFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch posts.' });
  }
});

// ─── ADD SUPPORT (like) ───────────────────────────────────
router.post('/:id/support', protect, async (req, res) => {
  try {
    const post = await Wellbeing.findOne({ _id: req.params.id, isPrivate: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const already = post.supportedBy.includes(req.user._id);
    if (already) {
      post.supportedBy.pull(req.user._id);
      post.supportCount = Math.max(0, post.supportCount - 1);
    } else {
      post.supportedBy.push(req.user._id);
      post.supportCount += 1;
    }
    await post.save();
    res.json({ success: true, supported: !already, supportCount: post.supportCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update support.' });
  }
});

// ─── ADD REPLY ────────────────────────────────────────────
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Reply text is required.' });

    const post = await Wellbeing.findOne({ _id: req.params.id, isPrivate: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    post.replies.push({
      text: text.trim(),
      author: req.user._id,
      authorName: isAdmin ? `[Admin] ${req.user.name}` : 'Fellow Student',
      isAdminReply: isAdmin,
    });
    await post.save();

    const io = req.app.get('io');
    io.emit('new_reply', { postId: post._id });

    res.status(201).json({ success: true, message: 'Reply added.', replies: post.replies });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add reply.' });
  }
});

// ─── GET RAGGING REPORTS (ragging admin + superadmin only) ─
router.get('/ragging/private', protect, raggingAdminOnly, async (req, res) => {
  try {
    const posts = await Wellbeing.find({ category: 'ragging' }).sort({ createdAt: -1 });
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch ragging reports.' });
  }
});

// ─── ACKNOWLEDGE RAGGING REPORT ───────────────────────────
router.patch('/ragging/:id/acknowledge', protect, raggingAdminOnly, async (req, res) => {
  try {
    const post = await Wellbeing.findOne({ _id: req.params.id, category: 'ragging' });
    if (!post) return res.status(404).json({ success: false, message: 'Report not found.' });

    post.isAcknowledged = true;
    post.acknowledgedBy = req.user._id;
    post.acknowledgedAt = new Date();
    post.status = 'in_review';
    await post.save();

    res.json({ success: true, message: 'Report acknowledged. Action will be taken.', post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to acknowledge.' });
  }
});

module.exports = router;

// ─── DELETE OWN WELLBEING POST ────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const WellbeingPost = require('../models/WellbeingPost');
    const post = await WellbeingPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const isOwner = post.author?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    await WellbeingPost.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete post.' });
  }
});

// ─── DELETE WELLBEING REPLY ───────────────────────────────
router.delete('/:id/replies/:replyId', protect, async (req, res) => {
  try {
    const WellbeingPost = require('../models/WellbeingPost');
    const post = await WellbeingPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const reply = post.replies?.id(req.params.replyId);
    if (!reply) return res.status(404).json({ success: false, message: 'Reply not found.' });

    const isOwner = reply.author?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    post.replies.pull({ _id: req.params.replyId });
    await post.save();
    res.json({ success: true, message: 'Reply deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete reply.' });
  }
});
