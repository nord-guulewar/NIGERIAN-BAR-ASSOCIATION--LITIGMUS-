const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentPortalController = require('../controllers/paymentPortalController');

router.get(
  '/',
  protect,
  authorize('admin', 'accountant', 'cashier', 'clerk'),
  paymentPortalController.getPaymentPortal
);

router.post(
  '/process/:caseId',
  protect,
  authorize('admin', 'accountant', 'cashier', 'clerk'),
  paymentPortalController.processPayment
);

router.get(
  '/daily-report',
  protect,
  authorize('admin', 'accountant'),
  paymentPortalController.getDailyCollectionReport
);

module.exports = router;
