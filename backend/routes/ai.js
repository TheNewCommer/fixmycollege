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

// ─── FEATURE 4: AI CHATBOT ────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ success: false, message: 'Messages array required.' });
    }

    const systemPrompt = `You are "FixBot", a friendly AI assistant for FixMyCollege — a campus issue reporting platform at Sershah Engineering College, Bihar, India.

Your ONLY job is to help students report campus problems through a friendly conversation.

Your conversation flow:
1. Greet the student and ask them to describe their problem
2. Once they describe it, ask for the location (room number, building, floor)
3. Once you have description + location, extract all details and return a structured JSON

When you have enough info (description + location), respond with EXACTLY this JSON format wrapped in <REPORT> tags:
<REPORT>
{
  "ready": true,
  "title": "Short clear title (max 10 words)",
  "description": "The problem as student described",
  "category": "one of: cleanliness, hostel_infrastructure, mess, campus_infrastructure, electricity, water, internet_tech, security, other_civic",
  "urgency": "one of: low, medium, high, critical",
  "location": "specific location from student",
  "building": "one of: boys_hostel_1, boys_hostel_2, girls_hostel, mess_hall, main_building, campus_ground, library, lab, other",
  "message": "Your friendly confirmation message to show the student"
}
</REPORT>

Urgency rules:
- critical: health/safety risk (no water 24h+, broken lock, flooding)
- high: affects daily life (no electricity, overflowing bins)
- medium: inconvenient (slow wifi, broken bench)
- low: minor/cosmetic

Rules:
- Keep responses SHORT and friendly (1-3 sentences max unless showing report)
- Speak in simple English, be warm and helpful
- If student writes in Hindi/Hinglish, respond in simple English
- Ask only ONE question at a time
- If not enough info, ask for location specifically
- Don't ask about urgency — you judge it yourself
- Never discuss anything outside campus issue reporting`;

    const groqMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...groqMessages,
      ],
      temperature: 0.4,
      max_tokens: 600,
    });

    const content = response.choices[0].message.content.trim();

    // Check if report is ready
    const reportMatch = content.match(/<REPORT>([\s\S]*?)<\/REPORT>/);
    if (reportMatch) {
      try {
        const reportData = JSON.parse(reportMatch[1].trim());
        return res.json({
          success: true,
          message: reportData.message || "Great! I've filled in the report details for you. Please review and submit!",
          reportReady: true,
          reportData,
        });
      } catch (e) {
        // JSON parse failed, return as normal message
      }
    }

    res.json({ success: true, message: content, reportReady: false });
  } catch (err) {
    console.error('Chatbot error:', err);
    res.status(500).json({ success: false, message: 'AI service error. Please try again.' });
  }
});
