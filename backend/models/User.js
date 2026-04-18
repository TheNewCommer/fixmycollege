const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  rollNumber: {
    type: String,
    trim: true,
    uppercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student',
  },
  // For admins — which domain they manage
  adminDomain: {
    type: String,
    enum: ['hostel', 'mess', 'campus', 'cleanliness', 'tech', 'ragging', 'wellbeing', null],
    default: null,
  },
  phone: {
    type: String,
    trim: true,
  },
  hostel: {
    type: String,
    enum: ['boys_hostel_1', 'boys_hostel_2', 'girls_hostel', 'day_scholar', null],
    default: null,
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', null],
    default: null,
  },
  branch: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// ─── HASH PASSWORD BEFORE SAVE ────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── COMPARE PASSWORD ─────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─── HIDE SENSITIVE FIELDS ────────────────────────────────
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
