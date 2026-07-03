const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Judge = require('../models/Judge');
const Payment = require('../models/Payment');
const { protect, authorize } = require('../middleware/auth');
const moment = require('moment');

router.get('/dashboard', protect, async (req, res) => {
  try {
    const totalCases = await Case.countDocuments();
    const activeCases = await Case.countDocuments({
      status: { $in: ['Pending', 'In Progress', 'Adjourned'] }
    });
    const closedCases = await Case.countDocuments({
      status: { $in: ['Closed', 'Dismissed', 'Settled'] }
    });

    const totalJudges = await Judge.countDocuments({ isActive: true });

    const totalPayments = await Payment.countDocuments();
    const paidPayments = await Payment.countDocuments({ status: 'Paid' });
    const pendingPayments = await Payment.countDocuments({ status: 'Pending' });
    const overduePayments = await Payment.countDocuments({ status: 'Overdue' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const pendingAmount = await Payment.aggregate([
      { $match: { status: 'Pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const casesByType = await Case.aggregate([
      { $group: { _id: '$caseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const casesByState = await Case.aggregate([
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        cases: {
          total: totalCases,
          active: activeCases,
          closed: closedCases
        },
        judges: {
          total: totalJudges
        },
        payments: {
          total: totalPayments,
          paid: paidPayments,
          pending: pendingPayments,
          overdue: overduePayments
        },
        revenue: {
          total: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
          pending: pendingAmount.length > 0 ? pendingAmount[0].total : 0
        },
        analytics: {
          casesByType,
          casesByState
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/cases/monthly', protect, async (req, res) => {
  try {
    const { year = moment().year() } = req.query;

    const monthlyCases = await Case.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = monthNames.map((month, index) => {
      const data = monthlyCases.find(m => m._id === index + 1);
      return {
        month,
        count: data ? data.count : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        year,
        monthlyCases: result
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/judges/performance', protect, authorize('admin'), async (req, res) => {
  try {
    const judges = await Judge.find({ isActive: true });

    const performance = await Promise.all(
      judges.map(async (judge) => {
        const activeCases = await Case.countDocuments({
          assignedJudge: judge._id,
          status: { $in: ['Pending', 'In Progress', 'Adjourned'] }
        });

        const closedCases = await Case.countDocuments({
          assignedJudge: judge._id,
          status: { $in: ['Closed', 'Dismissed', 'Settled'] }
        });

        return {
          judge: {
            id: judge._id,
            name: judge.getFullName(),
            courtType: judge.courtType,
            state: judge.state
          },
          activeCases,
          closedCases,
          totalCasesHandled: judge.totalCasesHandled,
          currentCaseLoad: judge.currentCaseLoad,
          maxDailyCases: judge.maxDailyCases,
          utilizationRate: ((judge.currentCaseLoad / judge.maxDailyCases) * 100).toFixed(2)
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        judges: performance,
        count: performance.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/payments/summary', protect, authorize('admin', 'accountant'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const paymentsByType = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentType',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    const paymentsByState = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$state',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        paymentsByType,
        paymentsByState
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
