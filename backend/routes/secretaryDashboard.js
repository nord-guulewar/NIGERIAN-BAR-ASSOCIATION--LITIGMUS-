const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const secretaryDashboard = require('../controllers/secretaryDashboard');

// All routes require authentication and secretary role
router.use(protect);
router.use(authorize('secretary'));

// Dashboard summary
router.get('/summary', secretaryDashboard.getDashboardSummary);

// Cause list and hearings
router.get('/todays-hearings', secretaryDashboard.getTodaysHearings);
router.get('/upcoming-hearings', secretaryDashboard.getUpcomingHearings);

// Schedule hearing
router.post('/schedule-hearing/:caseId', secretaryDashboard.scheduleHearing);

// Notify lawyers
router.post('/notify-lawyers/:caseId', secretaryDashboard.notifyLawyers);

// Send reminders (can be automated via cron)
router.post('/send-reminders', secretaryDashboard.sendHearingReminders);

module.exports = router;
