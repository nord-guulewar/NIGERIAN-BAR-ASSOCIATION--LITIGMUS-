const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const registrarDashboard = require('../controllers/registrarDashboard');

// All routes require authentication and registrar role
router.use(protect);
router.use(authorize('registrar'));

// Dashboard summary
router.get('/summary', registrarDashboard.getDashboardSummary);

// Case registration and number generation
router.post('/register-case', registrarDashboard.registerCase);

// Case assignment
router.post('/assign-case/:caseId', registrarDashboard.assignCaseToJudge);
router.post('/schedule/validate', registrarDashboard.validateSchedule);
router.post('/schedule/suggest-slots', registrarDashboard.suggestScheduleSlots);

// Case reassignment
router.post('/reassign-case/:caseId', registrarDashboard.reassignCase);

// Get cases
router.get('/pending-cases', registrarDashboard.getPendingCases);
router.get('/all-cases', registrarDashboard.getAllCases);
router.get('/case/:caseId', registrarDashboard.getCaseDetails);

// Judge availability
router.get('/available-judges', registrarDashboard.getAvailableJudges);

module.exports = router;
