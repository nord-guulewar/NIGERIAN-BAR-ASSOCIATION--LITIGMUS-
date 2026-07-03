const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { canAccess } = require('../middleware/abac');

/**
 * Payment Verification Workflow
 * 
 * Phase 1: CLERK/CASHIER uploads transaction ID
 * - Sets status: PENDING_VERIFICATION
 * 
 * Phase 2: ACCOUNTANT verifies payment
 * - Checks transactionId exists in Payment table with status='Paid'
 * - Sets status: VERIFIED (approved) or REJECTED
 * 
 * Phase 3: DOCKET GENERATION (if verified)
 * - Docket can only be generated when paymentTransactionDetails.status === 'VERIFIED'
 */

// ⛔ PHASE 1: CLERK/CASHIER uploads transaction ID for cases that have been paid
// ROUTE: POST /api/payment-verification/cases/:caseId/upload-transaction
router.post('/cases/:caseId/upload-transaction', protect, authorize('admin', 'clerk', 'cashier'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { transactionId, paymentAmount, paymentMethod } = req.body;

    if (!transactionId || !paymentAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'transactionId, paymentAmount, and paymentMethod are required'
      });
    }

    // Verify case exists
    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // ABAC: Ensure user can only upload transaction for cases in their state/court
    if (!canAccess(req.user, 'case', caseData)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - you cannot upload transaction for this case'
      });
    }

    // Update case with transaction details
    caseData.transactionId = transactionId;
    caseData.paymentTransactionDetails = {
      status: 'PENDING_VERIFICATION', // Waiting for accountant approval
      amount: paymentAmount,
      method: paymentMethod,
      uploadedBy: req.user._id,
      uploadedByName: `${req.user.firstName} ${req.user.lastName}`,
      uploadedAt: new Date(),
      verifiedBy: null,
      verifiedByName: null,
      verifiedAt: null,
      rejectedBy: null,
      rejectedByName: null,
      rejectedAt: null,
      rejectionReason: null,
      approvalNotes: null
    };

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Transaction uploaded successfully - awaiting accountant verification',
      data: {
        caseNumber: caseData.caseNumber,
        transactionId,
        status: 'PENDING_VERIFICATION',
        uploadedBy: `${req.user.firstName} ${req.user.lastName}`,
        uploadedAt: caseData.paymentTransactionDetails.uploadedAt
      }
    });
  } catch (error) {
    console.error('Upload transaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⛔ PHASE 2: ACCOUNTANT verifies payment exists and approves transaction
// ROUTE: POST /api/payment-verification/cases/:caseId/verify-payment
router.post('/cases/:caseId/verify-payment', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { approvalNotes } = req.body;

    // Only accountants and admin can verify
    if (req.user.role !== 'accountant' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only Accountant or Admin can verify payments'
      });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Check transaction has been uploaded
    if (!caseData.paymentTransactionDetails || !caseData.transactionId) {
      return res.status(400).json({
        success: false,
        message: 'No transaction uploaded - Clerk must upload transaction ID first',
        action: 'POST /api/payment-verification/cases/:id/upload-transaction'
      });
    }

    // Verify payment exists in Payment table with status='Paid'
    const payment = await Payment.findOne({
      transactionReference: caseData.transactionId,
      status: 'Paid'
    });

    if (!payment) {
      return res.status(400).json({
        success: false,
        message: `Payment with transaction ID "${caseData.transactionId}" not found or not marked as 'Paid'`,
        transactionId: caseData.transactionId,
        action: 'Payment must exist in Payment table with status=Paid'
      });
    }

    // Verify case state matches payment state (accountant can only verify own state)
    if (req.user.role === 'accountant' && caseData.state !== req.user.state) {
      return res.status(403).json({
        success: false,
        message: `Access denied - Accountant in ${req.user.state} cannot verify payment for case in ${caseData.state}`
      });
    }

    // Approve payment - set verified status
    caseData.paymentTransactionDetails.status = 'VERIFIED';
    caseData.paymentTransactionDetails.verifiedBy = req.user._id;
    caseData.paymentTransactionDetails.verifiedByName = `${req.user.firstName} ${req.user.lastName}`;
    caseData.paymentTransactionDetails.verifiedAt = new Date();
    caseData.paymentTransactionDetails.approvalNotes = approvalNotes || 'Payment verified and approved';

    // Update case fees status
    caseData.fees.paymentStatus = 'Verified';

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully - Docket generation now available',
      data: {
        caseNumber: caseData.caseNumber,
        transactionId: caseData.transactionId,
        status: 'VERIFIED',
        verifiedBy: caseData.paymentTransactionDetails.verifiedByName,
        verifiedAt: caseData.paymentTransactionDetails.verifiedAt,
        canGenerateDocket: true,
        nextAction: 'POST /api/dockets/dockets/generate'
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ⛔ PHASE 2b: ACCOUNTANT rejects payment with reason (requires re-upload)
// ROUTE: POST /api/payment-verification/cases/:caseId/reject-payment
router.post('/cases/:caseId/reject-payment', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { caseId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // Verify case state matches (accountant can only reject own state)
    if (req.user.role === 'accountant' && caseData.state !== req.user.state) {
      return res.status(403).json({
        success: false,
        message: `Access denied - Accountant in ${req.user.state} cannot reject payment for case in ${caseData.state}`
      });
    }

    // Record rejection
    caseData.paymentTransactionDetails.status = 'REJECTED';
    caseData.paymentTransactionDetails.rejectedBy = req.user._id;
    caseData.paymentTransactionDetails.rejectedByName = `${req.user.firstName} ${req.user.lastName}`;
    caseData.paymentTransactionDetails.rejectedAt = new Date();
    caseData.paymentTransactionDetails.rejectionReason = rejectionReason;

    // Clear transaction ID so clerk must re-upload
    caseData.transactionId = null;
    caseData.fees.paymentStatus = 'Rejected';

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Payment rejected - Clerk must upload correct transaction',
      data: {
        caseNumber: caseData.caseNumber,
        status: 'REJECTED',
        rejectionReason,
        rejectedBy: caseData.paymentTransactionDetails.rejectedByName,
        rejectedAt: caseData.paymentTransactionDetails.rejectedAt,
        nextAction: 'Clerk must upload correct transaction ID'
      }
    });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📊 ACCOUNTANT DASHBOARD: View all pending and verified payment transactions
// ROUTE: GET /api/payment-verification/payment-verification-status
router.get('/payment-verification-status', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    // Only accountant can filter by state
    const stateFilter = req.user.role === 'accountant' ? { state: req.user.state } : {};

    // Get all cases with payment transaction details
    const cases = await Case.findAll({
      where: stateFilter,
      attributes: [
        'id',
        'caseNumber',
        'title',
        'state',
        'courtType',
        'transactionId',
        'fees',
        'paymentTransactionDetails',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform to dashboard view
    const statusList = cases
      .filter(c => c.paymentTransactionDetails || c.transactionId) // Only show cases with transaction attempts
      .map(c => ({
        caseId: c.id,
        caseNumber: c.caseNumber,
        caseTitle: c.title,
        state: c.state,
        courtType: c.courtType,
        transactionId: c.transactionId,
        paymentStatus: c.paymentTransactionDetails?.status || 'PENDING',
        amount: c.paymentTransactionDetails?.amount || c.fees?.totalAmount || 0,
        method: c.paymentTransactionDetails?.method || null,
        uploadedBy: c.paymentTransactionDetails?.uploadedByName || null,
        uploadedAt: c.paymentTransactionDetails?.uploadedAt || null,
        verifiedBy: c.paymentTransactionDetails?.verifiedByName || null,
        verifiedAt: c.paymentTransactionDetails?.verifiedAt || null,
        rejectionReason: c.paymentTransactionDetails?.rejectionReason || null,
        canGenerateDocket: c.paymentTransactionDetails?.status === 'VERIFIED'
      }));

    // Count statistics
    const total = statusList.length;
    const pending = statusList.filter(s => s.paymentStatus === 'PENDING_VERIFICATION').length;
    const verified = statusList.filter(s => s.paymentStatus === 'VERIFIED').length;
    const rejected = statusList.filter(s => s.paymentStatus === 'REJECTED').length;

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          total,
          pendingVerification: pending,
          verified,
          rejected,
          readyForDocket: verified
        },
        transactions: statusList,
        state: req.user.role === 'accountant' ? req.user.state : 'All'
      }
    });
  } catch (error) {
    console.error('Payment verification status error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 📋 CLERK/CASHIER DASHBOARD: View cases pending transaction upload
// ROUTE: GET /api/payment-verification/pending-transactions
router.get('/pending-transactions', protect, authorize('admin', 'clerk', 'cashier'), async (req, res) => {
  try {
    // Get cases that need transaction upload
    const stateFilter = req.user.role === 'clerk' ? { state: req.user.state } : {};
    const courtFilter = req.user.courtType ? { courtType: req.user.courtType } : {};

    const cases = await Case.findAll({
      where: {
        ...stateFilter,
        ...courtFilter,
        transactionId: null // No transaction uploaded yet
      },
      attributes: [
        'id',
        'caseNumber',
        'title',
        'state',
        'courtType',
        'fees',
        'filingDate',
        'createdAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    const pendingList = cases.map(c => ({
      caseId: c.id,
      caseNumber: c.caseNumber,
      caseTitle: c.title,
      state: c.state,
      courtType: c.courtType,
      amount: c.fees?.totalAmount || 0,
      dateNeeded: c.createdAt,
      action: 'POST /api/payment-verification/cases/:id/upload-transaction'
    }));

    res.status(200).json({
      success: true,
      data: {
        pendingTransactionUploads: pendingList.length,
        cases: pendingList,
        userState: req.user.role === 'clerk' ? req.user.state : 'All'
      }
    });
  } catch (error) {
    console.error('Pending transactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
