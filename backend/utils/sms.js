const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ─── DOMAIN TO ADMIN PHONE MAPPING ───────────────────────
const domainPhoneMap = {
  hostel: process.env.ADMIN_HOSTEL_PHONE,
  mess: process.env.ADMIN_MESS_PHONE,
  campus: process.env.ADMIN_CAMPUS_PHONE,
  cleanliness: process.env.ADMIN_CAMPUS_PHONE,
  tech: process.env.ADMIN_CAMPUS_PHONE,
  ragging: process.env.ADMIN_RAGGING_PHONE,
  wellbeing: process.env.ADMIN_CAMPUS_PHONE,
  superadmin: process.env.SUPERADMIN_PHONE,
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
  const phone = domainPhoneMap[report.adminDomain];
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
  const phone = domainPhoneMap['ragging'];
  const message =
    `🚨 URGENT — FixMyCollege\n` +
    `A RAGGING report has been submitted.\n` +
    `Please check your private ragging dashboard IMMEDIATELY.\n` +
    `Time: ${new Date().toLocaleString('en-IN')}`;
  return sendSMS(phone, message);
};

// ─── NOTIFY SUPERADMIN ────────────────────────────────────
const notifySuperAdmin = async (message) => {
  const phone = domainPhoneMap['superadmin'];
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
  domainPhoneMap,
};
