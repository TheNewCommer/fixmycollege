# FixMyCollege 🏫
### Real-time Campus Issue Reporting & Wellbeing Platform
**Sershah Engineering College, Bihar**

---

## What This Does

FixMyCollege is a **fully working, real-world** web application where:
- Students report civic issues (dustbin overflow, tap leakage, broken lights, mess food, etc.)
- The responsible admin **gets an instant SMS** on their phone
- Admin opens the app, **assigns the issue**, and **uploads proof when resolved**
- Students track live status updates — Pending → Assigned → In Progress → Resolved
- A **Wellbeing Wall** for anonymous peer support and academic stress
- **Ragging reports** go privately to one trusted admin only — never visible publicly

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18 + React Router |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas (free) |
| Real-time | Socket.io |
| SMS Alerts | Twilio |
| Image Upload | Cloudinary |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Setup Instructions

### Step 1 — MongoDB Atlas (Free Database)
1. Go to https://cloud.mongodb.com and create a free account
2. Create a free cluster (M0 — free forever)
3. Create a database user with username and password
4. Whitelist IP: `0.0.0.0/0` (allow all)
5. Copy your connection string — it looks like:
   `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fixmycollege`

### Step 2 — Twilio (SMS)
1. Go to https://www.twilio.com and create a free account
2. Get a free phone number (US number, works for SMS to Indian numbers with country code)
3. Copy your **Account SID**, **Auth Token**, and **Phone Number**
4. Add your friends' Indian phone numbers in `.env` with +91 prefix

### Step 3 — Cloudinary (Image Upload)
1. Go to https://cloudinary.com and create a free account
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the dashboard

### Step 4 — Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in all values in .env
node server.js
```

### Step 5 — Frontend Setup
```bash
cd frontend
npm install
# Create .env file:
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
npm start
```

### Step 6 — Create Super Admin Account
After starting the server, manually update one user's role in MongoDB Atlas:
1. Open MongoDB Atlas → Browse Collections → users
2. Find your account
3. Change `role` from `"student"` to `"superadmin"`
4. Now login and go to `/superadmin` to create admin accounts for your friends

---

## Admin Domains

Each admin friend manages a specific domain:

| Domain | What They Handle |
|---|---|
| `hostel` | Hostel infrastructure, water issues |
| `mess` | Mess food, kitchen cleanliness |
| `campus` | Campus infrastructure, electricity, security |
| `cleanliness` | Dustbins, corridor cleanliness |
| `tech` | WiFi, lab equipment, internet |
| `ragging` | **Private** ragging reports only |
| `wellbeing` | Peer support wall moderation |

---

## Deployment

### Backend on Render
1. Push backend folder to GitHub
2. Go to https://render.com → New Web Service
3. Connect your GitHub repo
4. Set environment variables (all from .env)
5. Build command: `npm install`
6. Start command: `node server.js`

### Frontend on Vercel
1. Push frontend folder to GitHub
2. Go to https://vercel.com → New Project
3. Connect your GitHub repo
4. Add environment variable:
   `REACT_APP_API_URL=https://your-render-url.onrender.com/api`
5. Deploy

---

## Features Summary

### Civic Issues Section
- ✅ Report with photo upload
- ✅ 9 categories — cleanliness, hostel, mess, water, electricity, campus, tech, security, other
- ✅ Urgency levels — Low, Medium, High, Critical
- ✅ Admin gets instant SMS when report is submitted
- ✅ Real-time status updates via Socket.io
- ✅ Community upvoting
- ✅ Comments and discussion
- ✅ Activity timeline on each report
- ✅ Admin uploads proof photo when resolved
- ✅ Filter by category, status, urgency

### Wellbeing Wall Section
- ✅ Anonymous posting
- ✅ Categories: Peer Support, Academic Pressure, Mental Health, Personal
- ✅ Feeling emoji selector
- ✅ Peer replies with support
- ✅ Ragging reports — 100% private, SMS to trusted admin only
- ✅ Admin replies visible as [Admin] tag

### Admin Dashboard (Mobile Friendly)
- ✅ Domain-specific view (each admin sees only their reports)
- ✅ Urgency-sorted display
- ✅ One-tap status updates
- ✅ Note to reporter
- ✅ Proof photo upload
- ✅ Real-time new report notifications

### Super Admin Panel
- ✅ Create admin accounts for friends
- ✅ View all ragging reports privately
- ✅ Acknowledge ragging reports
- ✅ View full admin team

### Analytics
- ✅ Bar chart — reports by category
- ✅ Pie chart — urgency distribution
- ✅ Line graph — weekly trend
- ✅ Resolution status chart
- ✅ Live stats — total, resolved, resolution rate

---

## Project Structure

```
fixmycollege/
├── backend/
│   ├── server.js              # Main server + Socket.io
│   ├── models/
│   │   ├── User.js            # Students & admins
│   │   ├── Report.js          # Civic issue reports
│   │   └── Wellbeing.js       # Peer support + ragging
│   ├── routes/
│   │   ├── auth.js            # Register, login, JWT
│   │   ├── reports.js         # CRUD + upvote + comments
│   │   ├── admin.js           # Status updates, proof upload
│   │   ├── wellbeing.js       # Wall posts, ragging pipeline
│   │   └── stats.js           # Analytics data
│   ├── middleware/
│   │   └── auth.js            # JWT + role-based guards
│   └── utils/
│       ├── sms.js             # Twilio SMS notifications
│       └── cloudinary.js      # Image upload
└── frontend/
    └── src/
        ├── App.js             # Router + auth guards
        ├── context/
        │   ├── AuthContext.js # Login state
        │   └── SocketContext.js # Real-time connection
        ├── services/
        │   └── api.js         # All API calls
        ├── components/
        │   ├── Navbar.js      # Navigation
        │   └── ReportCard.js  # Report display card
        └── pages/
            ├── Landing.js     # Home page
            ├── Login.js
            ├── Register.js
            ├── Reports.js     # Reports feed
            ├── ReportDetail.js
            ├── SubmitReport.js
            ├── WellbeingWall.js
            ├── AdminDashboard.js
            ├── SuperAdminPanel.js
            ├── Analytics.js
            ├── MyReports.js
            └── Profile.js
```

---

*Built for Sershah Engineering College — Academic Year 2025-26*
*Team: Vyuha | Guide: Mrs. Anshu*
