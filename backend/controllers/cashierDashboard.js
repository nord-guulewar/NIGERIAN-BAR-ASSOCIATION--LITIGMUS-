const Case = require('../models/Case');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { generateReceiptNumber } = require('../utils/caseNumberGenerator');

// Get Cashier Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const cashierId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's collections
    const todaysPayments = await Payment.find({
      receivedBy: cashierId,
      paymentDate: { $gte: today, $lt: tomorrow }
    });

    const todaysRevenue = todaysPayments.reduce((sum, p) => sum + p.amount, 0);
    const todaysCount = todaysPayments.length;

    // Pending banking
    const pendingBanking = await Payment.find({
      receivedBy: cashierId,
      banked: false
    });

    const pendingAmount = pendingBanking.reduce((sum, p) => sum + p.amount, 0);

    // Total collections
    const totalPayments = await Payment.countDocuments({ receivedBy: cashierId });
    const allPayments = await Payment.find({ receivedBy: cashierId });
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        cashier: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          todaysRevenue,
          todaysCount,
          pendingAmount,
          pendingCount: pendingBanking.length,
          totalPayments,
          totalRevenue
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

// Process Payment
exports.processPayment = async (req, res) => {
  try {
    const { caseId, paymentType, amount, paidBy, paymentMethod, notes } = req.body;

    let caseData = null;
    let caseNumber = null;

    if (caseId) {
      caseData = await Case.findById(caseId);
      if (!caseData) {
        return res.status(404).json({
          success: false,
          message: 'Case not found'
        });
      }
      caseNumber = caseData.caseNumber;
    }

    // Generate receipt number
    const receiptNumber = generateReceiptNumber(paymentType, req.user.state);

    // Create payment record
    const payment = await Payment.create({
      receiptNumber,
      case: caseId,
      caseNumber,
      paymentType,
      amount,
      paidBy,
      paymentMethod,
      receivedBy: req.user._id,
      state: req.user.state,
      court: req.user.court,
      notes
    });

    // Update case if filing fee
    if (caseData && paymentType === 'Filing Fee') {
      caseData.filingFee = {
        amount,
        paid: true,
        paymentDate: new Date(),
        receiptNumber
      };
      await caseData.save();
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: { payment }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Payment History
exports.getPaymentHistory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { receivedBy: req.user._id };

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('case', 'caseNumber title')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark as Banked
exports.markAsBanked = async (req, res) => {
  try {
    const { paymentIds } = req.body; // Array of payment IDs

    await Payment.updateMany(
      { _id: { $in: paymentIds } },
      { banked: true, bankingDate: new Date() }
    );

    res.status(200).json({
      success: true,
      message: 'Payments marked as banked'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Daily Report
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    reportDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reportDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const payments = await Payment.find({
      receivedBy: req.user._id,
      paymentDate: { $gte: reportDate, $lt: nextDay }
    }).populate('case', 'caseNumber title');

    const summary = {
      date: reportDate,
      totalTransactions: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      byPaymentType: {},
      byPaymentMethod: {}
    };

    // Group by payment type
    payments.forEach(p => {
      if (!summary.byPaymentType[p.paymentType]) {
        summary.byPaymentType[p.paymentType] = { count: 0, amount: 0 };
      }
      summary.byPaymentType[p.paymentType].count++;
      summary.byPaymentType[p.paymentType].amount += p.amount;

      if (!summary.byPaymentMethod[p.paymentMethod]) {
        summary.byPaymentMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      summary.byPaymentMethod[p.paymentMethod].count++;
      summary.byPaymentMethod[p.paymentMethod].amount += p.amount;
    });

    res.status(200).json({
      success: true,
      data: { summary, payments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Reconcile Daily Collections
exports.reconcileDay = async (req, res) => {
  try {
    const {
      date,
      expectedTotal,
      expectedTransactionCount,
      notes
    } = req.body || {};

    const reconcileDate = date ? new Date(date) : new Date();
    reconcileDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(reconcileDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const payments = await Payment.find({
      receivedBy: req.user._id,
      paymentDate: { $gte: reconcileDate, $lt: nextDay }
    });

    const actualTotal = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const actualTransactionCount = payments.length;
    const bankedTotal = payments
      .filter((p) => p.banked)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const unbankedTotal = payments
      .filter((p) => !p.banked)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const expectedTotalNumber = expectedTotal !== undefined && expectedTotal !== null && expectedTotal !== ''
      ? Number(expectedTotal)
      : null;
    const expectedCountNumber = expectedTransactionCount !== undefined && expectedTransactionCount !== null && expectedTransactionCount !== ''
      ? Number(expectedTransactionCount)
      : null;

    const varianceAmount = expectedTotalNumber !== null ? actualTotal - expectedTotalNumber : 0;
    const varianceCount = expectedCountNumber !== null ? actualTransactionCount - expectedCountNumber : 0;

    const alerts = [];
    if (expectedTotalNumber !== null && Math.abs(varianceAmount) > 0) {
      alerts.push({
        type: 'amount_mismatch',
        severity: Math.abs(varianceAmount) > 10000 ? 'high' : 'medium',
        message: `Reconciliation amount variance detected: ${varianceAmount > 0 ? '+' : ''}${varianceAmount.toLocaleString('en-NG')}`
      });
    }
    if (expectedCountNumber !== null && varianceCount !== 0) {
      alerts.push({
        type: 'count_mismatch',
        severity: Math.abs(varianceCount) > 3 ? 'high' : 'medium',
        message: `Transaction count variance detected: ${varianceCount > 0 ? '+' : ''}${varianceCount}`
      });
    }
    if (unbankedTotal > 0) {
      alerts.push({
        type: 'pending_banking',
        severity: unbankedTotal > 50000 ? 'high' : 'medium',
        message: `Pending banking balance: ${unbankedTotal.toLocaleString('en-NG')}`
      });
    }

    res.status(200).json({
      success: true,
      data: {
        date: reconcileDate,
        cashier: {
          id: req.user._id,
          name: `${req.user.firstName} ${req.user.lastName}`
        },
        summary: {
          expectedTotal: expectedTotalNumber,
          expectedTransactionCount: expectedCountNumber,
          actualTotal,
          actualTransactionCount,
          bankedTotal,
          unbankedTotal,
          varianceAmount,
          varianceCount,
          notes: notes || null
        },
        alerts,
        paymentIds: payments.map((p) => p._id)
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
