const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  requireVerifiedJudge,
  requireFreshJudgeSession,
  sensitiveJudgeRateLimiter,
  auditJudgeAction
} = require('../middleware/judgeSecurity');
const judgeExtended = require('../controllers/judgeDashboardExtended');

const judgeGuard = [protect, authorize('judge'), requireVerifiedJudge, requireFreshJudgeSession, sensitiveJudgeRateLimiter];

// Case Notes
router.post('/cases/:caseId/notes', judgeGuard, auditJudgeAction('caseNoteAdded'), judgeExtended.addCaseNote);
router.get('/notes', judgeGuard, judgeExtended.getCaseNotes);

// Notify Court Staff
router.post('/notify-staff', judgeGuard, auditJudgeAction('staffNotified'), judgeExtended.notifyCourtStaff);

// Calendar / Absence
router.post('/calendar', judgeGuard, auditJudgeAction('calendarEventAdded'), judgeExtended.addCalendarEvent);
router.get('/calendar', judgeGuard, judgeExtended.getCalendarEvents);

// Fines
router.post('/cases/:caseId/fines', judgeGuard, auditJudgeAction('fineImposed'), judgeExtended.imposeFine);
router.get('/fines', judgeGuard, judgeExtended.getFinesImposed);

// Accountant Fine Access
router.get('/accountant/fines', protect, authorize('accountant', 'admin'), judgeExtended.getAllFinesForAccountant);
router.put('/accountant/fines/:fineId', protect, authorize('accountant', 'admin'), judgeExtended.updateFineStatus);

module.exports = router;
