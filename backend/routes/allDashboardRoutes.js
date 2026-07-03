const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// Import all dashboard controllers
const clerkDashboard = require('../controllers/clerkDashboard');
const recordsOfficerDashboard = require('../controllers/recordsOfficerDashboard');
const bailiffDashboard = require('../controllers/bailiffDashboard');
const cashierDashboard = require('../controllers/cashierDashboard');
const accountantDashboard = require('../controllers/accountantDashboard');
const allOtherDashboards = require('../controllers/allOtherDashboards');
const notificationController = require('../controllers/notificationController');

// ==================== NOTIFICATION ROUTES ====================
router.get('/notifications', protect, notificationController.getNotifications);
router.get('/notifications/unread-count', protect, notificationController.getUnreadCount);
router.put('/notifications/:notificationId/read', protect, notificationController.markAsRead);
router.delete('/notifications/:notificationId', protect, notificationController.deleteNotification);
router.delete('/notifications/clear-read', protect, notificationController.clearReadNotifications);
router.delete('/judge/notifications/:notificationId', protect, authorize('judge'), notificationController.judgeDeleteSentNotification);

// ==================== CLERK ROUTES ====================
router.get('/clerk/summary', protect, authorize('clerk'), clerkDashboard.getDashboardSummary);
router.post('/clerk/upload-documents/:caseId', protect, authorize('clerk'), clerkDashboard.uploadDocuments);
router.post('/clerk/record-proceedings/:caseId', protect, authorize('clerk'), clerkDashboard.recordProceedings);
router.get('/clerk/todays-hearings', protect, authorize('clerk'), clerkDashboard.getTodaysHearings);
router.get('/clerk/cases', protect, authorize('clerk'), clerkDashboard.getAllCases);
router.get('/clerk/filing-checklist/:caseId', protect, authorize('clerk'), clerkDashboard.getFilingChecklist);
router.put('/clerk/filing-checklist/:caseId', protect, authorize('clerk'), clerkDashboard.updateFilingChecklist);
router.get('/clerk/incomplete-filings', protect, authorize('clerk'), clerkDashboard.getIncompleteFilings);

// ==================== RECORDS OFFICER ROUTES ====================
router.get('/records/summary', protect, authorize('record_officer'), recordsOfficerDashboard.getDashboardSummary);
router.post('/records/archive/:caseId', protect, authorize('record_officer'), recordsOfficerDashboard.archiveCase);
router.post('/records/retrieve/:caseId', protect, authorize('record_officer'), recordsOfficerDashboard.retrieveCase);
router.get('/records/search', protect, authorize('record_officer'), recordsOfficerDashboard.searchCases);
router.get('/records/needs-archiving', protect, authorize('record_officer'), recordsOfficerDashboard.getCasesNeedingArchiving);

// ==================== BAILIFF ROUTES ====================
router.get('/bailiff/summary', protect, authorize('bailiff'), bailiffDashboard.getDashboardSummary);
router.get('/bailiff/summons', protect, authorize('bailiff'), bailiffDashboard.getAssignedSummons);
router.get('/bailiff/service-sla', protect, authorize('bailiff'), bailiffDashboard.getServiceSla);
router.post('/bailiff/record-service/:summonsId', protect, authorize('bailiff'), bailiffDashboard.recordService);
router.post('/bailiff/mark-failed/:summonsId', protect, authorize('bailiff'), bailiffDashboard.markServiceFailed);
router.post('/bailiff/create-summons', protect, authorize('bailiff', 'secretary', 'clerk'), bailiffDashboard.createSummons);

// ==================== CASHIER ROUTES ====================
router.get('/cashier/summary', protect, authorize('cashier'), cashierDashboard.getDashboardSummary);
router.post('/cashier/process-payment', protect, authorize('cashier'), cashierDashboard.processPayment);
router.get('/cashier/payment-history', protect, authorize('cashier'), cashierDashboard.getPaymentHistory);
router.post('/cashier/mark-banked', protect, authorize('cashier'), cashierDashboard.markAsBanked);
router.get('/cashier/daily-report', protect, authorize('cashier'), cashierDashboard.getDailyReport);
router.post('/cashier/reconcile-day', protect, authorize('cashier'), cashierDashboard.reconcileDay);

// ==================== ACCOUNTANT ROUTES ====================
router.get('/accountant/summary', protect, authorize('accountant'), accountantDashboard.getDashboardSummary);
router.get('/accountant/financial-report', protect, authorize('accountant'), accountantDashboard.getFinancialReport);
router.get('/accountant/monthly-summary', protect, authorize('accountant'), accountantDashboard.getMonthlySummary);
router.get('/accountant/verify-payment/:receiptNumber', protect, authorize('accountant'), accountantDashboard.verifyPayment);
router.get('/accountant/reconciliation-overview', protect, authorize('accountant'), accountantDashboard.getReconciliationOverview);
router.get('/accountant/variance-alerts', protect, authorize('accountant'), accountantDashboard.getVarianceAlerts);

// ==================== LIBRARIAN ROUTES ====================
router.get('/librarian/summary', protect, authorize('librarian'), allOtherDashboards.librarianDashboard.getSummary);
router.get('/librarian/research-requests', protect, authorize('librarian'), allOtherDashboards.librarianDashboard.getResearchRequests);
router.post('/librarian/submit-research/:requestId', protect, authorize('librarian'), allOtherDashboards.librarianDashboard.submitResearch);

// ==================== LITIGATION OFFICER ROUTES ====================
router.get('/litigation/summary', protect, authorize('litigation'), allOtherDashboards.litigationOfficerDashboard.getSummary);
router.get('/litigation/government-cases', protect, authorize('litigation'), allOtherDashboards.litigationOfficerDashboard.getGovernmentCases);

// ==================== PROSECUTOR ROUTES ====================
router.get('/prosecutor/summary', protect, authorize('prosecutor'), allOtherDashboards.prosecutorDashboard.getSummary);
router.get('/prosecutor/criminal-cases', protect, authorize('prosecutor'), allOtherDashboards.prosecutorDashboard.getCriminalCases);

// ==================== PROBATE OFFICER ROUTES ====================
router.get('/probate/summary', protect, authorize('probate'), allOtherDashboards.probateOfficerDashboard.getSummary);

// ==================== COURT REPORTER ROUTES ====================
router.get('/reporter/summary', protect, authorize('court_reporter'), allOtherDashboards.courtReporterDashboard.getSummary);

// ==================== USHER ROUTES ====================
router.get('/usher/summary', protect, authorize('usher'), allOtherDashboards.usherDashboard.getSummary);

// ==================== SECURITY OFFICER ROUTES ====================
router.get('/security/summary', protect, authorize('security'), allOtherDashboards.securityOfficerDashboard.getSummary);
router.post('/security/log-incident', protect, authorize('security'), allOtherDashboards.securityOfficerDashboard.logIncident);

// ==================== ADMINISTRATOR ROUTES ====================
router.get('/admin/summary', protect, authorize('admin'), allOtherDashboards.administratorDashboard.getSummary);
router.get('/admin/staff', protect, authorize('admin'), allOtherDashboards.administratorDashboard.getAllStaff);
router.get('/admin/analytics', protect, authorize('admin'), allOtherDashboards.administratorDashboard.getSystemAnalytics);

module.exports = router;
