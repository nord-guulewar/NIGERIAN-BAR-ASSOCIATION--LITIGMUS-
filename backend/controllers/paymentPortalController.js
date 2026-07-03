const Case = require('../models/Case');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { calculateCaseFees } = require('../config/courtFees');
const { generateReceiptNumber } = require('../utils/caseNumberGenerator');
const { paymentPortalProcessSchema, sanitizeObject } = require('../utils/validation');

const VALID_FEE_TYPES = ['filingFee', 'hearingFee', 'processFee', 'bailiffFee', 'judgmentFee'];
const FEE_TYPE_TO_PAYMENT_TYPE = {
  filingFee: 'Filing Fee',
  hearingFee: 'Hearing Fee',
  processFee: 'Administrative Fee',
  bailiffFee: 'Administrative Fee',
  judgmentFee: 'Judgment Fee'
};

const ensureCaseFees = (caseData) => {
  if (caseData.fees && Number(caseData.fees.totalAmount || 0) > 0) {
    return;
  }

  const feeStructure = calculateCaseFees(caseData.courtType, caseData.caseType);
  caseData.fees = {
    filingFee: { amount: feeStructure.filingFee, paid: false },
    hearingFee: { amount: feeStructure.hearingFee, paid: false },
    processFee: { amount: feeStructure.processFee, paid: false },
    bailiffFee: { amount: feeStructure.bailiffFee, paid: false },
    judgmentFee: { amount: feeStructure.judgmentFee, paid: false },
    totalAmount: feeStructure.totalAmount,
    totalPaid: 0,
    paymentStatus: 'Unpaid',
    payments: []
  };
};

const resolvePaymentSelection = (caseData, feeTypes) => {
  ensureCaseFees(caseData);

  const selectedFeeTypes = Array.from(new Set((feeTypes && feeTypes.length > 0 ? feeTypes : VALID_FEE_TYPES)
    .filter((feeType) => VALID_FEE_TYPES.includes(feeType))));

  const payableFeeTypes = selectedFeeTypes.filter((feeType) => {
    const fee = caseData.fees?.[feeType];
    return fee && Number(fee.amount || 0) > 0 && !fee.paid;
  });

  if (payableFeeTypes.length === 0) {
    return { selectedFeeTypes: [], totalAmount: 0 };
  }

  const totalAmount = payableFeeTypes.reduce((sum, feeType) => sum + Number(caseData.fees[feeType].amount || 0), 0);
  return { selectedFeeTypes: payableFeeTypes, totalAmount };
};

const formatValidationError = (error) => error.details.map((detail) => detail.message).join(', ');

exports.getPaymentPortal = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const userState = req.user.state;
    const userCourt = req.user.court;

    let query = {};
    let allowedActions = [];

    switch (userRole) {
      case 'admin':
        allowedActions = ['view_all', 'process_payment', 'refund', 'generate_report'];
        break;

      case 'accountant':
        query = { state: userState, courtType: userCourt };
        allowedActions = ['view_court', 'process_payment', 'generate_report', 'reconcile'];
        break;

      case 'cashier':
        query = { state: userState, courtType: userCourt };
        allowedActions = ['view_court', 'process_payment', 'generate_receipt'];
        break;

      case 'clerk':
        query = { state: userState, courtType: userCourt };
        allowedActions = ['view_court', 'process_payment'];
        break;

      default:
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access the payment portal'
        });
    }

    const pendingPayments = await Case.find({
      ...query,
      'fees.paymentStatus': { $in: ['Unpaid', 'Partially Paid'] }
    })
      .select('caseNumber suitNumber title fees plaintiff defendant')
      .sort({ createdAt: -1 })
      .limit(50);

    const recentPayments = await Payment.find({
      ...(userRole === 'admin' ? {} : { state: userState, courtType: userCourt }),
      status: 'Paid',
      paymentDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .populate('relatedCase', 'caseNumber suitNumber title')
      .populate('processedBy', 'firstName lastName')
      .sort({ paymentDate: -1 })
      .limit(20);

    const stats = await Payment.aggregate([
      {
        $match: userRole === 'admin' ? {} : { state: userState, courtType: userCourt }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const todayCollection = await Payment.aggregate([
      {
        $match: {
          ...(userRole === 'admin' ? {} : { state: userState, courtType: userCourt }),
          paymentDate: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lt: new Date(new Date().setHours(23, 59, 59, 999))
          },
          status: 'Paid'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          role: userRole,
          permissions: allowedActions
        },
        pendingPayments: pendingPayments.map(c => ({
          caseId: c._id,
          caseNumber: c.caseNumber,
          suitNumber: c.suitNumber,
          title: c.title,
          plaintiff: c.plaintiff?.name,
          defendant: c.defendant?.name,
          totalAmount: c.fees?.totalAmount || 0,
          totalPaid: c.fees?.totalPaid || 0,
          balance: (c.fees?.totalAmount || 0) - (c.fees?.totalPaid || 0),
          paymentStatus: c.fees?.paymentStatus || 'Unpaid'
        })),
        recentPayments,
        statistics: {
          byStatus: stats,
          todayCollection: todayCollection[0] || { total: 0, count: 0 }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const userRole = req.user.role;
    const allowedRoles = ['admin', 'accountant', 'cashier', 'clerk'];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to process payments'
      });
    }

    const { caseId } = req.params;
    const sanitizedData = sanitizeObject(req.body);
    const { error, value } = paymentPortalProcessSchema.validate(sanitizedData, {
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
      feeTypes,
      paymentMethod,
      payer,
      description
    } = value;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (userRole !== 'admin') {
      if (caseData.state !== req.user.state || caseData.courtType !== req.user.court) {
        return res.status(403).json({
          success: false,
          message: 'You can only process payments for cases in your court'
        });
      }
    }

    ensureCaseFees(caseData);

    const { selectedFeeTypes, totalAmount } = resolvePaymentSelection(caseData, feeTypes);

    if (selectedFeeTypes.length === 0 || totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No unpaid fee items are available for payment on this case'
      });
    }

    const receiptNumber = generateReceiptNumber('Court Fee', caseData.state);
    const transactionReference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const paymentType = selectedFeeTypes.length === 1
      ? FEE_TYPE_TO_PAYMENT_TYPE[selectedFeeTypes[0]]
      : 'Administrative Fee';

    const payment = await Payment.create({
      paymentType,
      amount: totalAmount,
      dueDate: new Date(),
      paymentDate: new Date(),
      paymentMethod,
      receiptNumber,
      transactionReference,
      relatedCase: caseId,
      state: caseData.state,
      courtType: caseData.courtType,
      payer,
      description: description || `Payment for ${caseData.caseNumber} - ${caseData.suitNumber || 'N/A'}`,
      status: 'Paid',
      processedBy: req.user._id
    });

    caseData.fees.payments.push(payment._id);
    caseData.fees.totalPaid = Math.min(
      Number(caseData.fees.totalAmount || 0),
      Number(caseData.fees.totalPaid || 0) + totalAmount
    );
    selectedFeeTypes.forEach((feeType) => {
      if (caseData.fees[feeType]) {
        caseData.fees[feeType].paid = true;
      }
    });

    if (caseData.fees.totalPaid >= caseData.fees.totalAmount) {
      caseData.fees.paymentStatus = 'Fully Paid';
    } else if (caseData.fees.totalPaid > 0) {
      caseData.fees.paymentStatus = 'Partially Paid';
    }

    await caseData.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('relatedCase', 'caseNumber title suitNumber')
      .populate('processedBy', 'firstName lastName email role');

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment: populatedPayment,
        receipt: {
          receiptNumber,
          transactionReference,
          caseNumber: caseData.caseNumber,
          suitNumber: caseData.suitNumber,
          amount: totalAmount,
          paymentDate: new Date(),
          processedBy: `${req.user.firstName} ${req.user.lastName}`,
          balance: caseData.fees.totalAmount - caseData.fees.totalPaid
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getDailyCollectionReport = async (req, res) => {
  try {
    const userRole = req.user.role;
    const allowedRoles = ['admin', 'accountant'];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view collection reports'
      });
    }

    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const query = {
      paymentDate: { $gte: reportDate, $lt: nextDay },
      status: 'Paid'
    };

    if (userRole !== 'admin') {
      query.state = req.user.state;
      query.courtType = req.user.court;
    }

    const collections = await Payment.find(query)
      .populate('relatedCase', 'caseNumber suitNumber title')
      .populate('processedBy', 'firstName lastName role')
      .sort({ paymentDate: 1 });

    const summary = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            paymentMethod: '$paymentMethod',
            paymentType: '$paymentType'
          },
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalCollection = collections.reduce((sum, payment) => sum + payment.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        date: reportDate,
        totalCollection,
        totalTransactions: collections.length,
        collections,
        summary,
        generatedBy: `${req.user.firstName} ${req.user.lastName}`,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;
