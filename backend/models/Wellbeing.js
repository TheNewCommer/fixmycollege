const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: [500, 'Reply cannot exceed 500 characters'],
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  authorName: { type: String, default: 'Anonymous' },
  isAdminReply: { type: Boolean, default: false },
  isCounsellor: { type: Boolean, default: false },
}, { timestamps: true });

const wellbeingSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['peer_support', 'academic_pressure', 'ragging', 'mental_health', 'personal'],
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [1000, 'Post cannot exceed 1000 characters'],
  },
  feeling: {
    type: String,
    enum: ['anxious', 'stressed', 'sad', 'angry', 'overwhelmed', 'hopeful', 'confused', null],
    default: null,
  },
  // Always anonymous — no author stored for ragging
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // For ragging — completely private, only ragging admin sees it
  isPrivate: { type: Boolean, default: false },
  // Ragging reports get SMS to private admin only
  smsSent: { type: Boolean, default: false },
  // Admin acknowledgement
  isAcknowledged: { type: Boolean, default: false },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acknowledgedAt: { type: Date, default: null },

  replies: [replySchema],
  supportCount: { type: Number, default: 0 },
  supportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  status: {
    type: String,
    enum: ['open', 'in_review', 'resolved', 'closed'],
    default: 'open',
  },
}, { timestamps: true });

// ─── AUTO-SET PRIVATE FOR RAGGING ────────────────────────
wellbeingSchema.pre('save', function (next) {
  if (this.category === 'ragging') {
    this.isPrivate = true;
  }
  next();
});

wellbeingSchema.index({ category: 1, createdAt: -1 });
wellbeingSchema.index({ isPrivate: 1 });

module.exports = mongoose.model('Wellbeing', wellbeingSchema);
