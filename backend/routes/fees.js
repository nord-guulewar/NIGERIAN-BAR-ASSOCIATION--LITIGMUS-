const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const feeController = require('../controllers/feeController');

router.get('/structure', protect, feeController.getFeeStructure);

router.get('/case/:caseId', protect, feeController.getCaseFees);

router.post('/case/:caseId/payment', protect, authorize('admin', 'accountant', 'cashier', 'clerk'), feeController.processCasePayment);

router.get('/receipt/:paymentId', protect, feeController.getPaymentReceipt);

module.exports = router;
