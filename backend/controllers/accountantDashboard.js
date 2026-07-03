const Payment = require('../models/Payment');
const User = require('../models/User');

// Get Accountant Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const state = req.user.state;
    const court = req.user.court;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Month start
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's revenue
    const todaysPayments = await Payment.find({
      state,
      court,
      paymentDate: { $gte: today, $lt: tomorrow }
    });
    const todaysRevenue = todaysPayments.reduce((sum, p) => sum + p.amount, 0);

    // Month's revenue
    const monthPayments = await Payment.find({
      state,
      court,
      paymentDate: { $gte: monthStart }
    });
    const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

    // Pending banking
    const pendingBanking = await Payment.find({
      state,
      court,
      banked: false
    });
    const pendingAmount = pendingBanking.reduce((sum, p) => sum + p.amount, 0);

    // Total revenue
    const allPayments = await Payment.find({ state, court });
    const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      data: {
        accountant: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          todaysRevenue,
          monthRevenue,
          pendingAmount,
          totalRevenue,
          todaysTransactions: todaysPayments.length,
          monthTransactions: monthPayments.length
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

// Get Financial Report
exports.getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const query = {
      state: req.user.state,
      court: req.user.court
    };

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query)
      .populate('receivedBy', 'firstName lastName')
      .sort({ paymentDate: -1 });

    const report = {
      period: { startDate, endDate },
      totalTransactions: payments.length,
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      byPaymentType: {},
      byPaymentMethod: {},
      byCashier: {},
      byDate: {}
    };

    payments.forEach(p => {
      // By payment type
      if (!report.byPaymentType[p.paymentType]) {
        report.byPaymentType[p.paymentType] = { count: 0, amount: 0 };
      }
      report.byPaymentType[p.paymentType].count++;
      report.byPaymentType[p.paymentType].amount += p.amount;

      // By payment method
      if (!report.byPaymentMethod[p.paymentMethod]) {
        report.byPaymentMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      report.byPaymentMethod[p.paymentMethod].count++;
      report.byPaymentMethod[p.paymentMethod].amount += p.amount;

      // By cashier
      const cashierName = p.receivedBy ? `${p.receivedBy.firstName} ${p.receivedBy.lastName}` : 'Unknown';
      if (!report.byCashier[cashierName]) {
        report.byCashier[cashierName] = { count: 0, amount: 0 };
      }
      report.byCashier[cashierName].count++;
      report.byCashier[cashierName].amount += p.amount;

      // By date
      const dateKey = new Date(p.paymentDate).toISOString().split('T')[0];
      if (!report.byDate[dateKey]) {
        report.byDate[dateKey] = { count: 0, amount: 0 };
      }
      report.byDate[dateKey].count++;
      report.byDate[dateKey].amount += p.amount;
    });

    res.status(200).json({
      success: true,
      data: { report, payments }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Monthly Summary
exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth();

    const monthStart = new Date(targetYear, targetMonth, 1);
    const monthEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const payments = await Payment.find({
      state: req.user.state,
      court: req.user.court,
      paymentDate: { $gte: monthStart, $lte: monthEnd }
    });

    const summary = {
      month: monthStart.toLocaleString('default', { month: 'long', year: 'numeric' }),
      totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      totalTransactions: payments.length,
      bankedAmount: payments.filter(p => p.banked).reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: payments.filter(p => !p.banked).reduce((sum, p) => sum + p.amount, 0)
    };

    res.status(200).json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    const { receiptNumber } = req.params;

    const payment = await Payment.findOne({ receiptNumber })
      .populate('case', 'caseNumber title')
      .populate('receivedBy', 'firstName lastName');

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
};

// Reconciliation overview grouped by cashier
exports.getReconciliationOverview = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const payments = await Payment.find({
      state: req.user.state,
      court: req.user.court,
      paymentDate: { $gte: targetDate, $lt: nextDay }
    }).populate('receivedBy', 'firstName lastName role');

    const byCashier = {};
    payments.forEach((payment) => {
      const cashierId = payment.receivedBy?._id || payment.receivedBy || 'unknown';
      const cashierName = payment.receivedBy
        ? `${payment.receivedBy.firstName} ${payment.receivedBy.lastName}`
        : 'Unknown Cashier';

      if (!byCashier[cashierId]) {
        byCashier[cashierId] = {
          cashierId,
          cashierName,
          totalCollected: 0,
          totalBanked: 0,
          totalUnbanked: 0,
          transactions: 0
        };
      }

      const amount = Number(payment.amount || 0);
      byCashier[cashierId].totalCollected += amount;
      byCashier[cashierId].transactions += 1;
      if (payment.banked) {
        byCashier[cashierId].totalBanked += amount;
      } else {
        byCashier[cashierId].totalUnbanked += amount;
      }
    });

    const overview = Object.values(byCashier).map((item) => ({
      ...item,
      collectionVariance: item.totalCollected - (item.totalBanked + item.totalUnbanked)
    }));

    res.status(200).json({
      success: true,
      data: {
        date: targetDate,
        summary: {
          totalCollected: overview.reduce((sum, item) => sum + item.totalCollected, 0),
          totalBanked: overview.reduce((sum, item) => sum + item.totalBanked, 0),
          totalUnbanked: overview.reduce((sum, item) => sum + item.totalUnbanked, 0),
          totalTransactions: overview.reduce((sum, item) => sum + item.transactions, 0)
        },
        cashiers: overview
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Variance alerts for accountant monitoring
exports.getVarianceAlerts = async (req, res) => {
  try {
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const payments = await Payment.find({
      state: req.user.state,
      court: req.user.court,
      paymentDate: { $ne: null }
    }).populate('receivedBy', 'firstName lastName role');

    const alerts = [];

    payments.forEach((payment) => {
      const amount = Number(payment.amount || 0);
      const cashierName = payment.receivedBy
        ? `${payment.receivedBy.firstName} ${payment.receivedBy.lastName}`
        : 'Unknown Cashier';

      if (!payment.banked && payment.paymentDate && new Date(payment.paymentDate) <= staleThreshold) {
        alerts.push({
          type: 'stale_unbanked_payment',
          severity: amount > 100000 ? 'high' : 'medium',
          paymentId: payment._id,
          receiptNumber: payment.receiptNumber,
          amount,
          cashierName,
          message: `Payment ${payment.receiptNumber || payment._id} has remained unbanked for more than 48 hours.`
        });
      }

      if (payment.paymentDate && payment.status === 'Pending') {
        alerts.push({
          type: 'payment_status_mismatch',
          severity: 'medium',
          paymentId: payment._id,
          receiptNumber: payment.receiptNumber,
          amount,
          cashierName,
          message: `Payment ${payment.receiptNumber || payment._id} has a payment date but status is still Pending.`
        });
      }

      if (!payment.receiptNumber) {
        alerts.push({
          type: 'missing_receipt_number',
          severity: 'high',
          paymentId: payment._id,
          amount,
          cashierName,
          message: `Payment record ${payment._id} is missing a receipt number.`
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        generatedAt: now,
        totalAlerts: alerts.length,
        alerts
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
