const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const { protect, adminOnly, superAdminOnly } = require('../middleware/auth');
const { uploadProofPhoto } = require('../utils/cloudinary');
const { notifyReporterStatusUpdate, notifySuperAdmin } = require('../utils/sms');

// All admin routes require login + admin role
router.use(protect, adminOnly);

// ─── GET DOMAIN REPORTS (admin sees only their domain) ────
router.get('/reports', async (req, res) => {
  try {
    const { status, urgency, page = 1, limit = 20 } = req.query;
    const filter = {};

    // Superadmin sees all, domain admin sees only their domain
    if (req.user.role !== 'superadmin') {
      filter.adminDomain = req.user.adminDomain;
    }
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ urgency: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('reportedBy', 'name email rollNumber phone')
      .populate('assignedTo', 'name');

    res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), reports });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
  }
});

// ─── UPDATE REPORT STATUS ─────────────────────────────────
router.patch('/reports/:id/status', async (req, res) => {
  try {
    const { status, note, assignedToName } = req.body;
    const validStatuses = ['assigned', 'in_progress', 'resolved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'phone name');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Check domain access
    if (req.user.role !== 'superadmin' && report.adminDomain !== req.user.adminDomain) {
      return res.status(403).json({ success: false, message: 'Not authorized for this domain.' });
    }

    const prevStatus = report.status;
    report.status = status;

    if (status === 'assigned') {
      report.assignedTo = req.user._id;
      report.assignedToName = assignedToName || req.user.name;
      report.assignNote = note || null;
    }
    if (status === 'resolved') {
      report.resolvedAt = new Date();
    }
    if (status === 'rejected') {
      report.rejectionReason = note || 'No reason provided';
    }

    // Add activity log
    report.activities.push({
      action: `Status changed from ${prevStatus} to ${status}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      note: note || null,
    });

    await report.save();

    // Notify reporter if they have a phone
    if (report.reportedBy?.phone) {
      await notifyReporterStatusUpdate(
        report.reportedBy.phone,
        report.title,
        status,
        note
      );
    }

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('status_update', {
      reportId: report._id,
      status: report.status,
      assignedToName: report.assignedToName,
    });

    res.json({ success: true, message: `Report marked as ${status}.`, report });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

// ─── UPLOAD PROOF PHOTO ───────────────────────────────────
router.post('/reports/:id/proof', uploadProofPhoto.single('proof'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    if (!req.file) return res.status(400).json({ success: false, message: 'Proof photo is required.' });

    report.proofPhoto = { url: req.file.path, publicId: req.file.filename };
    report.status = 'resolved';
    report.resolvedAt = new Date();
    report.activities.push({
      action: 'Proof photo uploaded — marked as resolved',
      performedBy: req.user._id,
      performedByName: req.user.name,
    });
    await report.save();

    const io = req.app.get('io');
    io.emit('status_update', { reportId: report._id, status: 'resolved' });

    res.json({ success: true, message: 'Proof uploaded and report resolved!', report });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to upload proof.' });
  }
});

// ─── GET ALL ADMINS (superadmin only) ─────────────────────
router.get('/team', superAdminOnly, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } }).select('-password');
    res.json({ success: true, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin team.' });
  }
});

// ─── CREATE ADMIN ACCOUNT (superadmin only) ───────────────
router.post('/create-admin', superAdminOnly, async (req, res) => {
  try {
    const { name, email, password, adminDomain, phone } = req.body;
    if (!name || !email || !password || !adminDomain) {
      return res.status(400).json({ success: false, message: 'All fields required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const admin = await User.create({ name, email, password, role: 'admin', adminDomain, phone });
    res.status(201).json({ success: true, message: 'Admin account created!', admin });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create admin.' });
  }
});

module.exports = router;
