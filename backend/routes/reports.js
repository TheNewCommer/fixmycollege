const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect, optionalAuth } = require('../middleware/auth');
const { uploadReportPhoto } = require('../utils/cloudinary');
const { notifyAdminNewReport } = require('../utils/sms');

// ─── CREATE REPORT ────────────────────────────────────────
router.post('/', optionalAuth, uploadReportPhoto.single('photo'), async (req, res) => {
  try {
    const { title, description, category, location, building, urgency, isAnonymous } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({ success: false, message: 'Title, description, category and location are required.' });
    }

    const reportData = {
      title: title.trim(),
      description: description.trim(),
      category,
      location: location.trim(),
      building: building || 'other',
      urgency: urgency || 'medium',
      isAnonymous: isAnonymous !== 'false',
      reportedBy: req.user ? req.user._id : null,
    };

    if (req.file) {
      reportData.photo = {
        url: req.file.path,
        publicId: req.file.filename,
      };
    }

    const report = await Report.create(reportData);

    // Add initial activity
    report.activities.push({
      action: 'Report submitted',
      performedByName: req.user ? req.user.name : 'Anonymous',
    });
    await report.save();

    // Emit real-time event
    const io = req.app.get('io');
    io.emit('new_report', {
      _id: report._id,
      title: report.title,
      category: report.category,
      urgency: report.urgency,
      status: report.status,
      location: report.location,
      createdAt: report.createdAt,
    });

    // Send SMS to admin
    await notifyAdminNewReport(report);

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully! Admin has been notified.',
      report,
    });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit report. Please try again.' });
  }
});

// ─── GET ALL REPORTS (public) ─────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, status, urgency, building, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (req.query.excludeResolved === 'true') {
  filter.status = { $nin: ['resolved', 'rejected'] };
}
    if (urgency) filter.urgency = urgency;
    if (building) filter.building = building;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name rollNumber')
      .populate('assignedTo', 'name');

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      reports,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// ─── GET SINGLE REPORT ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name rollNumber hostel')
      .populate('assignedTo', 'name')
      .populate('comments.author', 'name');
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch report.' });
  }
});

// ─── UPVOTE REPORT ────────────────────────────────────────
router.post('/:id/upvote', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    const alreadyUpvoted = report.upvotes.includes(req.user._id);
    if (alreadyUpvoted) {
      report.upvotes.pull(req.user._id);
      report.upvoteCount = Math.max(0, report.upvoteCount - 1);
    } else {
      report.upvotes.push(req.user._id);
      report.upvoteCount += 1;
    }
    await report.save();

    const io = req.app.get('io');
    io.emit('upvote_update', { reportId: report._id, upvoteCount: report.upvoteCount });

    res.json({
      success: true,
      upvoted: !alreadyUpvoted,
      upvoteCount: report.upvoteCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upvote.' });
  }
});

// ─── ADD COMMENT ──────────────────────────────────────────
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text is required.' });

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    report.comments.push({
      text: text.trim(),
      author: req.user._id,
      authorName: req.user.name,
    });
    await report.save();

    const io = req.app.get('io');
    io.emit('new_comment', { reportId: report._id });

    res.status(201).json({ success: true, message: 'Comment added.', comments: report.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add comment.' });
  }
});

// ─── GET MY REPORTS ───────────────────────────────────────
router.get('/my/reports', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reportedBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch your reports.' });
  }
});

module.exports = router;
