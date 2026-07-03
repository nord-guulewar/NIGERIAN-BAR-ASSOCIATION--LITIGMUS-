const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const User = require('../models/User');
const Case = require('../models/Case');
const { protect, authorize } = require('../middleware/auth');
const { generateReceiptNumber } = require('../utils/caseNumberGenerator');
const { sendPaymentConfirmation } = require('../utils/notificationService');
const { isValidObjectId, paymentSchema, paymentUpdateSchema, sanitizeObject } = require('../utils/validation');
const moment = require('moment');

const DATE_RANGE_DAYS_MAX = 365;
const PAYMENT_FIELDS = [
  'paymentType','amount','dueDate','paymentDate','paymentMethod','state','courtType','payer','description','status'
];

function formatValidationError(error) {
  return error.details.map((detail) => detail.message).join(', ');
}

// ⛔ FINANCE ONLY - Accountant and Admin can create payments
router.post('/', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { error, value } = paymentSchema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: formatValidationError(error)
      });
    }

    const {
      paymentType,
      amount,
      dueDate,
      paymentMethod,
      relatedCase,
      state,
      courtType,
      payer,
      description,
      isRecurring,
      recurringFrequency
    } = value;

    let normalizedState = state;
    let normalizedCourtType = courtType;

    if (relatedCase) {
      const caseData = await Case.findById(relatedCase);
      if (!caseData) {
        return res.status(404).json({ success: false, message: 'Related case not found' });
      }

      normalizedState = caseData.state;
      normalizedCourtType = caseData.courtType;
    }

    let receiptNumber = null;
    let transactionReference = null;

    if (paymentMethod) {
      receiptNumber = generateReceiptNumber(paymentType, normalizedState);
      transactionReference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    const payment = await Payment.create({
      paymentType,
      amount,
      dueDate,
      paymentDate: paymentMethod ? new Date() : null,
      paymentMethod,
      receiptNumber,
      transactionReference,
      relatedCase,
      state: normalizedState,
      courtType: normalizedCourtType,
      payer,
      description,
      isRecurring,
      recurringFrequency,
      status: paymentMethod ? 'Paid' : 'Pending',
      processedBy: req.user._id
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate('relatedCase', 'caseNumber title')
      .populate('processedBy', 'firstName lastName email');

    // Send payment confirmation email if payer email is provided
    if (payer && payer.email && paymentMethod) {
      const caseData = relatedCase ? await Case.findById(relatedCase) : null;
      await sendPaymentConfirmation(
        payer.email,
        payer.name || 'Valued Customer',
        {
          receiptNumber: receiptNumber,
          amount: amount,
          date: new Date(),
          type: paymentType,
          method: paymentMethod
        },
        caseData
      );
    }

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { payment: populatedPayment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ⛔ FINANCE ONLY - List all payments (Accountant dashboard)
router.get('/', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { status, paymentType, state, courtType, startDate, endDate, page = '1', limit = '20' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const query = {};
    if (status) query.status = status;
    if (paymentType) query.paymentType = paymentType;
    if (state) query.state = state;
    if (courtType) query.courtType = courtType;

    if (startDate || endDate) {
      if ((startDate && Number.isNaN(Date.parse(startDate))) || (endDate && Number.isNaN(Date.parse(endDate)))) {
        return res.status(400).json({ success: false, message: 'Invalid date format' });
      }
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      if (start && end && end < start) {
        return res.status(400).json({ success: false, message: 'End date must be after start date' });
      }
      if (start && end && (end - start) / 86400000 > DATE_RANGE_DAYS_MAX) {
        return res.status(400).json({ success: false, message: 'Date range too large' });
      }
      query.dueDate = {};
      if (start) query.dueDate.$gte = start;
      if (end) query.dueDate.$lte = end;
    }

    const payments = await Payment.find(query)
      .populate('relatedCase', 'caseNumber title')
      .populate('processedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const count = await Payment.countDocuments(query);

    const totalAmount = await Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        totalPayments: count,
        totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ⛔ FINANCE ONLY - View due payments for collection
router.get('/due', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    const duePayments = await Payment.find({
      status: 'Pending',
      dueDate: { $gte: today, $lte: endOfDay }
    })
      .populate('relatedCase', 'caseNumber title')
      .populate('processedBy', 'firstName lastName email')
      .sort({ dueDate: 1 });

    const totalDue = await Payment.aggregate([
      {
        $match: {
          status: 'Pending',
          dueDate: { $gte: today, $lte: endOfDay }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments: duePayments,
        count: duePayments.length,
        totalDue: totalDue.length > 0 ? totalDue[0].total : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ⛔ FINANCE ONLY - View overdue payments
router.get('/overdue', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const today = moment().startOf('day').toDate();

    const overduePayments = await Payment.find({
      status: 'Pending',
      dueDate: { $lt: today }
    })
      .populate('relatedCase', 'caseNumber title')
      .populate('processedBy', 'firstName lastName email')
      .sort({ dueDate: 1 });

    for (let payment of overduePayments) {
      if (payment.status === 'Pending') {
        payment.status = 'Overdue';
        await payment.save();
      }
    }

    const totalOverdue = await Payment.aggregate([
      {
        $match: {
          status: 'Overdue',
          dueDate: { $lt: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments: overduePayments,
        count: overduePayments.length,
        totalOverdue: totalOverdue.length > 0 ? totalOverdue[0].total : 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ⛔ FINANCE ONLY - View specific payment details
router.get('/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }
    const payment = await Payment.findById(req.params.id)
      .populate('relatedCase', 'caseNumber title plaintiff defendant')
      .populate('processedBy', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const sanitizedData = sanitizeObject(req.body);
    const { error, value } = paymentUpdateSchema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: formatValidationError(error)
      });
    }

    if (value.relatedCase) {
      const caseData = await Case.findById(value.relatedCase);
      if (!caseData) {
        return res.status(404).json({ success: false, message: 'Related case not found' });
      }

      value.state = caseData.state;
      value.courtType = caseData.courtType;
    }

    if (value.paymentMethod && !payment.receiptNumber) {
      value.receiptNumber = generateReceiptNumber(value.paymentType || payment.paymentType, value.state || payment.state);
      value.transactionReference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      value.paymentDate = new Date();
      value.status = 'Paid';
    }

    const safeUpdate = {};
    for (const field of PAYMENT_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(value, field)) {
        safeUpdate[field] = value[field];
      }
    }

    if (value.receiptNumber) {
      safeUpdate.receiptNumber = value.receiptNumber;
    }
    if (value.transactionReference) {
      safeUpdate.transactionReference = value.transactionReference;
    }

    const updatedPayment = await Payment.findByIdAndUpdate(
      req.params.id,
      safeUpdate,
      { new: true, runValidators: true }
    ).populate('relatedCase', 'caseNumber title');

    res.status(200).json({
      success: true,
      message: 'Payment updated successfully',
      data: { payment: updatedPayment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid payment ID' });
    }
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;