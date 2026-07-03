const express = require('express');
const router = express.Router();
const Case = require('../models/Case');
const Judge = require('../models/Judge');
const { protect, authorize, abacFilter, getFilteredQuery } = require('../middleware/auth');
const { generateCaseNumber } = require('../utils/caseNumberGenerator');
const { calculateCaseFees } = require('../config/courtFees');
const { caseSchema, caseUpdateSchema, isValidObjectId, sanitizeObject } = require('../utils/validation');
const { docketRateLimiter } = require('../middleware/security');
const nigerianStates = require('../config/states');

const CASE_FIELDS = [
  'title','caseType','courtType','state','plaintiff','defendant',
  'priority','notes','assignedJudge','status'
];

function formatValidationError(error) {
  return error.details.map((detail) => detail.message).join(', ');
}

function buildCaseFees(courtType, caseType, existingFees = {}) {
  const feeStructure = calculateCaseFees(courtType, caseType);

  return {
    filingFee: {
      amount: feeStructure.filingFee,
      paid: existingFees.filingFee?.paid || false
    },
    hearingFee: {
      amount: feeStructure.hearingFee,
      paid: existingFees.hearingFee?.paid || false
    },
    processFee: {
      amount: feeStructure.processFee,
      paid: existingFees.processFee?.paid || false
    },
    bailiffFee: {
      amount: feeStructure.bailiffFee,
      paid: existingFees.bailiffFee?.paid || false
    },
    judgmentFee: {
      amount: feeStructure.judgmentFee,
      paid: existingFees.judgmentFee?.paid || false
    },
    totalAmount: feeStructure.totalAmount,
    totalPaid: Number(existingFees.totalPaid || 0),
    paymentStatus: existingFees.paymentStatus || 'Unpaid',
    payments: existingFees.payments || []
  };
}

router.post('/', protect, authorize('admin', 'registrar', 'clerk'), async (req, res) => {
  try {
    const sanitizedData = sanitizeObject(req.body);
    const { error, value } = caseSchema.validate(sanitizedData, {
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
      title,
      caseType,
      courtType,
      state,
      plaintiff,
      defendant,
      filingFee,
      priority,
      notes
    } = value;

    const stateObj = nigerianStates.find(s => s.code === state || s.name === state);
    if (!stateObj) {
      return res.status(400).json({
        success: false,
        message: 'Invalid state code or name'
      });
    }

     const todayCases = await Case.countDocuments({
       createdAt: {
         $gte: new Date(new Date().setHours(0, 0, 0, 0)),
         $lt: new Date(new Date().setHours(23, 59, 59, 999))
       },
       courtType,
       state: stateObj.code
     });

     const sequenceNumber = todayCases + 1;
     // Generate case number - format: [COURT]/[STATE]/[LGA]/[YEAR]/[SEQUENCE]
     // For now, we'll use a default LGA since it's not in the request body
     // In a real implementation, LGA would be part of the case data
     const lgaCode = 'Ikeja'; // Default LGA for Lagos State
     const caseNumberResult = await generateCaseNumber(courtType, stateObj.code, lgaCode, caseType);
     const caseNumber = caseNumberResult.caseNumber;

    const availableJudges = await Judge.find({
      courtType,
      state: stateObj.code,
      isActive: true,
      specialization: caseType
    }).sort({ currentCaseLoad: 1 });

    let assignedJudge = null;
    if (availableJudges.length > 0) {
      for (let judge of availableJudges) {
        if (judge.canTakeCase()) {
          assignedJudge = judge._id;
          judge.currentCaseLoad += 1;
          judge.totalCasesHandled += 1;
          await judge.save();
          break;
        }
      }
    }

    const newCase = await Case.create({
      caseNumber,
      title,
      caseType,
      courtType,
      state: stateObj.code,
      plaintiff,
      defendant,
      assignedJudge,
      fees: buildCaseFees(courtType, caseType),
      priority,
      notes,
      registeredBy: req.user._id
    });

    const populatedCase = await Case.findById(newCase._id)
      .populate('assignedJudge', 'firstName lastName title email')
      .populate('registeredBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Case registered successfully',
      data: { case: populatedCase }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/', protect, abacFilter('case'), async (req, res) => {
  try {
    const { status, courtType, state, caseType, page = 1, limit = '20' } = req.query;
    const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    
    // Start with ABAC filters (enforces state/court/assignment restrictions)
    const query = { ...getFilteredQuery(req) };
    
    // Add user-provided filters
    if (status) query.status = status;
    if (courtType) query.courtType = courtType;
    if (state && req.user.role === 'admin') query.state = state; // Only admin can override state
    if (caseType) query.caseType = caseType;

    const cases = await Case.find(query)
      .populate('assignedJudge', 'firstName lastName title email')
      .populate('registeredBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const count = await Case.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        cases,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        totalCases: count
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID' });
    }
    const caseData = await Case.findById(req.params.id)
      .populate('assignedJudge', 'firstName lastName title email phoneNumber')
      .populate('registeredBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // ABAC: Check if user can access this case
    const { canAccess } = require('../middleware/abac');
    if (!canAccess(req.user, 'case', caseData)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this case'
      });
    }

    res.status(200).json({
      success: true,
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/:id', protect, authorize('admin', 'registrar', 'clerk', 'judge'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID' });
    }
    const existing = await Case.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    const sanitizedData = sanitizeObject(req.body);
    const { error, value } = caseUpdateSchema.validate(sanitizedData, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: formatValidationError(error)
      });
    }

    const safeUpdate = {};
    for (const field of CASE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(value, field)) {
        safeUpdate[field] = value[field];
      }
    }

    if (safeUpdate.state) {
      const stateObj = nigerianStates.find((entry) => entry.code === safeUpdate.state || entry.name === safeUpdate.state);
      if (!stateObj) {
        return res.status(400).json({ success: false, message: 'Invalid state code or name' });
      }
      safeUpdate.state = stateObj.code;
    }

    if (safeUpdate.courtType || safeUpdate.caseType) {
      const nextCourtType = safeUpdate.courtType || existing.courtType;
      const nextCaseType = safeUpdate.caseType || existing.caseType;
      safeUpdate.fees = buildCaseFees(nextCourtType, nextCaseType, existing.fees || {});
    }

    safeUpdate.lastModifiedBy = req.user._id;
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      safeUpdate,
      { new: true, runValidators: true }
    ).populate('assignedJudge', 'firstName lastName title email');

    res.status(200).json({
      success: true,
      message: 'Case updated successfully',
      data: { case: updatedCase }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/:id/hearing', protect, authorize('admin', 'registrar', 'clerk', 'judge'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid case ID' });
    }
    const { date, time, notes } = sanitizeObject(req.body);

    const caseData = await Case.findById(req.params.id);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Hearing date is required' });
    }

    if (Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ success: false, message: 'Invalid hearing date' });
    }

    caseData.hearingDates.push({
      date,
      time: time || null,
      notes: notes || '',
      status: 'Scheduled'
    });

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Hearing date added successfully',
      data: { case: caseData }
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
    const caseData = await Case.findById(req.params.id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    await Case.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Case deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
