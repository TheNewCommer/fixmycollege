const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── VERIFY JWT TOKEN ─────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User no longer exists or is deactivated.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ─── OPTIONAL AUTH (for anonymous reports) ───────────────
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) req.user = user;
    }
  } catch (err) {
    // Silent fail for optional auth
  }
  next();
};

// ─── ADMIN ONLY ───────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }
  next();
};

// ─── SUPERADMIN ONLY ──────────────────────────────────────
const superAdminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Access denied. Super admins only.' });
  }
  next();
};

// ─── RAGGING ADMIN ONLY ───────────────────────────────────
const raggingAdminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (req.user.role !== 'superadmin' && req.user.adminDomain !== 'ragging') {
    return res.status(403).json({ success: false, message: 'Access denied. Ragging admin only.' });
  }
  next();
};

// ─── GENERATE JWT TOKEN ───────────────────────────────────
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, optionalAuth, adminOnly, superAdminOnly, raggingAdminOnly, generateToken };
