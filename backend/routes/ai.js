const express = require('express');
const router = express.Router();
const { classifyReport, analyzeSentiment, detectDuplicates } = require('../utils/ai');
const Report = require('../models/Report');
const { optionalAuth } = require('../middleware/auth');

// ─── FEATURE 1: CLASSIFY REPORT ──────────────────────────
// Frontend calls this as student types description
// Returns suggested title, category, urgency
router.post('/classify', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please write at least 10 characters for AI to analyze.',
      });
    }
    const result = await classifyReport(description.trim());
    if (!result.success) {
      return res.status(500).json({ success: false, message: 'AI classification failed. Please fill manually.' });
    }
    res.json({ success: true, classification: result });
  } catch (err) {
    console.error('Classify route error:', err);
    res.status(500).json({ success: false, message: 'AI service error.' });
  }
});

// ─── FEATURE 2: ANALYZE WELLBEING POST SENTIMENT ─────────
router.post('/sentiment', async (req, res) => {
  try {
    const { content, category } = req.body;
    if (!content || content.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Content too short.' });
    }
    const result = await analyzeSentiment(content.trim(), category || 'peer_support');
    res.json({ success: true, analysis: result });
  } catch (err) {
    console.error('Sentiment route error:', err);
    res.status(500).json({ success: false, message: 'AI service error.' });
  }
});

// ─── FEATURE 3: DETECT DUPLICATE REPORTS ─────────────────
router.post('/detect-duplicate', optionalAuth, async (req, res) => {
  try {
    const { description, category } = req.body;
    if (!description || !category) {
      return res.status(400).json({ success: false, message: 'Description and category required.' });
    }
    // Get recent open/in-progress reports of same category
    const existingReports = await Report.find({
      category,
      status: { $in: ['pending', 'assigned', 'in_progress'] },
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .select('_id title description category location status upvoteCount');

    const result = await detectDuplicates(description, category, existingReports);
    // Get full details of similar reports to show user
    let similarReportDetails = [];
    if (result.hasDuplicate && result.similarReports?.length > 0) {
      similarReportDetails = await Report.find({
        _id: { $in: result.similarReports },
      }).select('_id title location status upvoteCount createdAt');
    }
    res.json({
      success: true,
      hasDuplicate: result.hasDuplicate,
      confidence: result.confidence,
      reason: result.reason,
      similarReports: similarReportDetails,
    });
  } catch (err) {
    console.error('Duplicate route error:', err);
    res.status(500).json({ success: false, message: 'AI service error.' });
  }
});

module.exports = router;
