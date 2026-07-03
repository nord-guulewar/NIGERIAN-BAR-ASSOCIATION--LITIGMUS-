const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  requireVerifiedJudge,
  requireFreshJudgeSession,
  sensitiveJudgeRateLimiter,
  auditJudgeAction
} = require('../middleware/judgeSecurity');
const judgeDashboard = require('../controllers/judgeDashboard');

const judgeGuard = [protect, authorize('judge'), requireVerifiedJudge, requireFreshJudgeSession, sensitiveJudgeRateLimiter];

// All routes require authentication and judge role
router.use(protect);
router.use(authorize('judge'));

// Dashboard summary with greeting
router.get('/summary', judgeGuard, judgeDashboard.getDashboardSummary);

// Get all assigned cases
router.get('/cases', judgeGuard, judgeDashboard.getAssignedCases);

// Get today's cases (max 15)
router.get('/cases/today', judgeGuard, judgeDashboard.getTodaysCases);

// Get case details
router.get('/cases/:caseId', judgeGuard, judgeDashboard.getCaseDetails);

// Deliver judgment
router.post('/cases/:caseId/judgment', judgeGuard, auditJudgeAction('judgmentDelivered'), judgeDashboard.deliverJudgment);

// Adjourn case
router.post('/cases/:caseId/adjourn', judgeGuard, auditJudgeAction('caseAdjourned'), judgeDashboard.adjournCase);

// Transfer case to another judge
router.post('/cases/:caseId/transfer', judgeGuard, auditJudgeAction('caseTransferred'), judgeDashboard.transferCase);

// Get available judges for transfer
router.get('/available-judges', judgeGuard, judgeDashboard.getAvailableJudges);

module.exports = router;
