const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { hasPermission, getDashboardSections } = require('../middleware/rolePermissions');
const { docketGenerationSchema, isValidObjectId, sanitizeObject } = require('../utils/validation');
const { docketRateLimiter } = require('../middleware/security');
const Docket = require('../models/Docket');
const Case = require('../models/Case');
const User = require('../models/User');

const DOCKET_SORT_FIELDS = ['createdAt', 'docketNumber', 'status', 'priority', 'hearingDate'];

function formatValidationError(error) {
  return error.details.map((detail) => detail.message).join(', ');
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: `Your role (${req.user.role}) does not have permission: ${permission}`
      });
    }
    next();
  };
}

router.get('/permissions', protect, async (req, res) => {
  try {
    const sections = getDashboardSections(req.user.role);
    const perms = {};
    const permKeys = [
      'canViewAllCases', 'canViewPayments', 'canViewReports', 'canManageUsers',
      'canGenerateDocket', 'canAcknowledgeDocket', 'canViewProBono', 'canDocumentProBono',
      'canFileCase', 'canAssignJudge', 'canTransferCase', 'canViewAllDashboards',
      'canDeliverJudgment', 'canManageFees'
    ];
    permKeys.forEach(key => { perms[key] = hasPermission(req.user.role, key); });
    res.json({ success: true, data: { role: req.user.role, sections, permissions: perms } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/dockets/generate', protect, requirePermission('canGenerateDocket'), docketRateLimiter, async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { error, value } = docketGenerationSchema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: formatValidationError(error)
      });
    }

    const { caseId, sentToId, summary, priority, hearingDate } = value;

    if (!isValidObjectId(caseId) || !isValidObjectId(sentToId)) {
      return res.status(400).json({ success: false, message: 'Invalid case or recipient identifier' });
    }

    const caseDoc = await Case.findById(caseId);
    if (!caseDoc) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    // ⛔ PAYMENT VERIFICATION REQUIRED - Docket cannot be generated without verified payment
    if (!caseDoc.paymentTransactionDetails || caseDoc.paymentTransactionDetails.status !== 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot generate docket - Payment must be verified first',
        paymentStatus: caseDoc.paymentTransactionDetails?.status || 'PENDING',
        details: 'Clerk must upload transaction ID, then Accountant must verify payment before docket can be generated'
      });
    }

    const recipient = await User.findById(sentToId);
    if (!recipient || !['judge', 'Justice', 'Magistrate', 'Chief Magistrate'].includes(recipient.title || recipient.role)) {
      return res.status(400).json({ success: false, message: 'Recipient must be a judicial officer (Judge, Justice, Magistrate, or Chief Magistrate)' });
    }

    const year = new Date().getFullYear();
    const count = await Docket.countDocuments({
      docketNumber: { $regex: `^DKT-${year}` }
    });
    const docketNumber = `DKT-${year}-${String(count + 1).padStart(5, '0')}`;

    const docket = await Docket.create({
      docketNumber,
      case: caseId,
      generatedBy: req.user._id,
      sentTo: sentToId,
      sentToRole: recipient.title || recipient.role,
      court: caseDoc.courtType,
      state: caseDoc.state,
      summary: summary || `${caseDoc.caseNumber}: ${caseDoc.title}`,
      priority: priority || 'Medium',
      hearingDate: hearingDate || null,
      paymentVerifiedAt: caseDoc.paymentTransactionDetails.verifiedAt,
      paymentVerifiedBy: caseDoc.paymentTransactionDetails.verifiedByName
    });

    res.status(201).json({ success: true, data: { docket } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/dockets', protect, docketRateLimiter, async (req, res) => {
  try {
    const { status, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const filter = {};
    if (status) filter.status = status;

    if (hasPermission(req.user.role, 'canGenerateDocket')) {
      filter.generatedBy = req.user._id;
    } else if (hasPermission(req.user.role, 'canAcknowledgeDocket')) {
      filter.sentTo = req.user._id;
    } else {
      return res.status(403).json({ success: false, message: 'You do not have permission to view dockets' });
    }

    const sortField = DOCKET_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDir };

    const dockets = await Docket.find(filter)
      .populate('case', 'caseNumber title caseType status')
      .populate('generatedBy', 'firstName lastName role')
      .populate('sentTo', 'firstName lastName title staffId')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await Docket.countDocuments(filter);

    res.json({ success: true, data: { dockets, total, page: pageNum, pages: Math.ceil(total / limitNum) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/dockets/:id/acknowledge', protect, requirePermission('canAcknowledgeDocket'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid docket ID' });
    }
    const { acknowledgmentNote } = req.body;

    const docket = await Docket.findOne({ _id: req.params.id, sentTo: req.user._id });
    if (!docket) {
      return res.status(404).json({ success: false, message: 'Docket not found or not assigned to you' });
    }

    if (docket.status === 'Acknowledged') {
      return res.status(400).json({ success: false, message: 'This docket has already been acknowledged' });
    }

    docket.status = 'Acknowledged';
    docket.acknowledgedBy = req.user._id;
    docket.acknowledgedAt = new Date();
    docket.acknowledgmentNote = acknowledgmentNote || '';
    await docket.save();

    const populated = await Docket.findById(docket._id)
      .populate('case', 'caseNumber title caseType')
      .populate('generatedBy', 'firstName lastName role')
      .populate('acknowledgedBy', 'firstName lastName title staffId');

    res.json({ success: true, data: { docket: populated } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/judicial-officers', protect, async (req, res) => {
  try {
    const { state, court, title, search } = req.query;
    const filter = { role: 'judge', isActive: true };
    if (state) filter.state = state;
    if (court) filter.court = court;
    if (title) filter.title = title;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { staffId: { $regex: search, $options: 'i' } }
      ];
    }
    const officers = await User.find(filter)
      .select('firstName lastName title staffId court state courtDivision department email')
      .sort({ title: 1, lastName: 1 });
    res.json({ success: true, data: { officers } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
