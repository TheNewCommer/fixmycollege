const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, maxlength: 500 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: { type: String, default: 'Anonymous' },
  isAdminComment: { type: Boolean, default: false },
}, { timestamps: true });

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performedByName: { type: String },
  note: { type: String },
}, { timestamps: true });

const reportSchema = new mongoose.Schema({
  // ─── REPORT DETAILS ─────────────────────────────────────
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  category: {
    type: String,
    required: true,
    enum: [
      'cleanliness',
      'hostel_infrastructure',
      'mess',
      'campus_infrastructure',
      'electricity',
      'water',
      'internet_tech',
      'security',
      'other_civic',
    ],
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  // Which hostel/building
  building: {
    type: String,
    enum: ['boys_hostel_1', 'boys_hostel_2', 'girls_hostel', 'main_building', 'mess_hall', 'campus_ground', 'library', 'lab', 'other'],
  },
  // ─── MEDIA ───────────────────────────────────────────────
  photo: {
    url: { type: String },
    publicId: { type: String },
  },
  proofPhoto: {
    url: { type: String },
    publicId: { type: String },
  },
  // ─── URGENCY ─────────────────────────────────────────────
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  // ─── STATUS FLOW ─────────────────────────────────────────
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'resolved', 'rejected'],
    default: 'pending',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedToName: { type: String, default: null },
  assignNote: { type: String, default: null },
  resolvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  // ─── REPORTER ────────────────────────────────────────────
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = anonymous
  },
  isAnonymous: { type: Boolean, default: true },

  // ─── ENGAGEMENT ──────────────────────────────────────────
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  upvoteCount: { type: Number, default: 0 },
  comments: [commentSchema],
  activities: [activitySchema],

  // ─── ADMIN DOMAIN (auto-set based on category) ───────────
  adminDomain: {
    type: String,
    enum: ['hostel', 'mess', 'campus', 'cleanliness', 'tech'],
  },

  // ─── SMS SENT FLAG ───────────────────────────────────────
  smsSent: { type: Boolean, default: false },

}, { timestamps: true });

// ─── AUTO-SET ADMIN DOMAIN BASED ON CATEGORY ─────────────
reportSchema.pre('save', function (next) {
  const domainMap = {
    cleanliness: 'cleanliness',
    hostel_infrastructure: 'hostel',
    mess: 'mess',
    campus_infrastructure: 'campus',
    electricity: 'campus',
    water: 'hostel',
    internet_tech: 'tech',
    security: 'campus',
    other_civic: 'campus',
  };
  this.adminDomain = domainMap[this.category] || 'campus';
  next();
});

// ─── INDEXES ─────────────────────────────────────────────
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ adminDomain: 1, status: 1 });
reportSchema.index({ category: 1 });

module.exports = mongoose.model('Report', reportSchema);
