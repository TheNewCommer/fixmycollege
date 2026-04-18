const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');

// ─── REGISTER ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, rollNumber, hostel, year, branch } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      rollNumber: rollNumber?.trim(),
      hostel: hostel || null,
      year: year || null,
      branch: branch?.trim(),
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        hostel: user.hostel,
        year: user.year,
        branch: user.branch,
      },
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ─── LOGIN ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        adminDomain: user.adminDomain,
        rollNumber: user.rollNumber,
        hostel: user.hostel,
        year: user.year,
        branch: user.branch,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ─── GET CURRENT USER ─────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: req.user });
});

// ─── UPDATE PROFILE ───────────────────────────────────────
router.patch('/profile', protect, async (req, res) => {
  try {
const { name, phone, hostel, year, branch, adminDomain } = req.body;
const updates = {};
if (name) updates.name = name.trim();
if (phone) updates.phone = phone.trim();
if (hostel) updates.hostel = hostel;
if (year) updates.year = year;
if (branch) updates.branch = branch.trim();
if (adminDomain) updates.adminDomain = adminDomain;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated!', user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
