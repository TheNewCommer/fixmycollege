const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Wellbeing = require('../models/Wellbeing');
const User = require('../models/User');

// ─── PUBLIC STATS ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [
      totalReports,
      resolvedReports,
      pendingReports,
      inProgressReports,
      totalUsers,
      totalWellbeingPosts,
      categoryStats,
      urgencyStats,
      recentActivity,
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'in_progress' }),
      User.countDocuments({ role: 'student' }),
      Wellbeing.countDocuments({ isPrivate: false }),
      Report.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Report.aggregate([
        { $group: { _id: '$urgency', count: { $sum: 1 } } },
      ]),
      Report.find({ status: 'resolved' })
        .sort({ resolvedAt: -1 })
        .limit(5)
        .select('title category resolvedAt'),
    ]);

    // Resolution rate
    const resolutionRate = totalReports > 0
      ? Math.round((resolvedReports / totalReports) * 100)
      : 0;

    // Weekly trend (last 7 days)
    const weeklyTrend = await Report.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalReports,
        resolvedReports,
        pendingReports,
        inProgressReports,
        totalUsers,
        totalWellbeingPosts,
        resolutionRate,
        categoryStats,
        urgencyStats,
        recentActivity,
        weeklyTrend,
      },
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch statistics.' });
  }
});

module.exports = router;
