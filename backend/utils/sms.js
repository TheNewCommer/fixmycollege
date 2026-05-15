const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── DOMAIN TO ADMIN PHONE MAPPING ───────────────────────
const getAdminPhone = (domain) => {
  // Mess category → mess admin
  if (domain === 'mess') return process.env.ADMIN_MESS_PHONE;
  // Tech/WiFi category → tech admin
  if (domain === 'tech') return process.env.ADMIN_TECH_PHONE;
  // Ragging → private ragging number
  if (domain === 'ragging') return process.env.ADMIN_RAGGING_PHONE;
  // Everything else → default (your number)
  return process.env.ADMIN_DEFAULT_PHONE;
};

// ─── SEND SMS ─────────────────────────────────────────────
const sendSMS = async (to, message) => {
  if (!to) {
    console.warn('SMS skipped: no phone number configured for this domain');
    return { success: false, reason: 'No phone number' };
  }
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    console.log(`✅ SMS sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error(`❌ SMS failed to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ─── NOTIFY ADMIN — NEW CIVIC REPORT ─────────────────────
const notifyAdminNewReport = async (report) => {
  const phone = getAdminPhone(report.adminDomain);
  const urgencyEmoji = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' };
  const message =
    `${urgencyEmoji[report.urgency] || '🔴'} FixMyCollege Alert!\n` +
    `New ${report.urgency.toUpperCase()} report:\n` +
    `📌 ${report.title}\n` +
    `📍 ${report.location}\n` +
    `🏷️ Category: ${report.category.replace(/_/g, ' ')}\n` +
    `🔗 Open dashboard to take action.`;
  return sendSMS(phone, message);
};

// ─── NOTIFY RAGGING ADMIN ─────────────────────────────────
const notifyRaggingAdmin = async (post) => {
  const phone = getAdminPhone('ragging');
  const message =
    `🚨 URGENT — FixMyCollege\n` +
    `A RAGGING report has been submitted.\n` +
    `Please check your private ragging dashboard IMMEDIATELY.\n` +
    `Time: ${new Date().toLocaleString('en-IN')}`;
  return sendSMS(phone, message);
};

// ─── NOTIFY SUPERADMIN ────────────────────────────────────
const notifySuperAdmin = async (message) => {
  const phone = process.env.ADMIN_DEFAULT_PHONE;
  return sendSMS(phone, `[FixMyCollege SuperAdmin]\n${message}`);
};

// ─── NOTIFY STATUS UPDATE TO REPORTER ────────────────────
const notifyReporterStatusUpdate = async (phone, reportTitle, newStatus, note) => {
  if (!phone) return { success: false };
  const statusText = {
    assigned: 'has been assigned to a worker',
    in_progress: 'is now being worked on',
    resolved: 'has been RESOLVED ✅',
    rejected: 'could not be processed',
  };
  const message =
    `FixMyCollege Update 📢\n` +
    `Your report "${reportTitle}" ${statusText[newStatus] || 'has been updated'}.\n` +
    (note ? `Note: ${note}\n` : '') +
    `Thank you for helping improve our campus!`;
  return sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  notifyAdminNewReport,
  notifyRaggingAdmin,
  notifySuperAdmin,
  notifyReporterStatusUpdate,
  getAdminPhone,
};
