const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Summons = require('../models/Summons');

const safeJsonString = (value) => {
  try {
    return JSON.stringify(value);
  } catch (error) {
    return null;
  }
};

const parseJsonString = (value) => {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

// Get Bailiff Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const bailiffId = req.user._id;

    // Summons assigned to this bailiff
    const pendingSummons = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: { $in: ['Pending', 'In Progress'] }
    });

    const servedToday = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: 'Served',
      serviceDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    const totalServed = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: 'Served'
    });

    const failedService = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: { $in: ['Failed', 'Returned Unserved'] }
    });

    res.status(200).json({
      success: true,
      data: {
        bailiff: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          pendingSummons,
          servedToday,
          totalServed,
          failedService
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

// Get Assigned Summons
exports.getAssignedSummons = async (req, res) => {
  try {
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = { assignedTo: req.user._id };
    if (status) query.status = status;

    const summonsList = await Summons.find(query)
      .populate('case', 'caseNumber title plaintiff defendant')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Summons.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        summons: summonsList,
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

// Record Service of Summons
exports.recordService = async (req, res) => {
  try {
    const { summonsId } = req.params;
    const {
      serviceMethod,
      serviceLocation,
      serviceNotes,
      proofOfService,
      recipientName,
      recipientRelationship,
      evidenceReference,
      gpsCoordinates,
      serviceTime
    } = req.body;

    const summons = await Summons.findById(summonsId);

    if (!summons) {
      return res.status(404).json({
        success: false,
        message: 'Summons not found'
      });
    }

    if (!serviceMethod || !serviceLocation) {
      return res.status(400).json({
        success: false,
        message: 'serviceMethod and serviceLocation are required.'
      });
    }

    summons.status = 'Served';
    summons.serviceDate = new Date();
    summons.serviceMethod = serviceMethod;
    summons.serviceLocation = serviceLocation;
    summons.serviceNotes = serviceNotes || 'Service completed by bailiff.';

    const previousProof = parseJsonString(summons.proofOfService);
    const proofPayload = {
      recipientName: recipientName || null,
      recipientRelationship: recipientRelationship || null,
      evidenceReference: evidenceReference || null,
      gpsCoordinates: gpsCoordinates || null,
      serviceTime: serviceTime || null,
      notes: serviceNotes || null,
      capturedAt: new Date(),
      capturedBy: req.user._id,
      previousProof
    };

    if (typeof proofOfService === 'string' && proofOfService.trim()) {
      proofPayload.manualReference = proofOfService.trim();
    }

    summons.proofOfService = safeJsonString(proofPayload) || summons.proofOfService;

    await summons.save();

    // Notify secretary and clerk
    const caseData = await Case.findById(summons.case);
    
    const staff = await User.find({
      role: { $in: ['secretary', 'clerk'] },
      state: req.user.state,
      court: req.user.court,
      isActive: true
    });

    for (const member of staff) {
      await Notification.create({
        recipient: member._id,
        type: 'document_uploaded',
        title: `Summons Served - ${summons.caseNumber}`,
        message: `Summons for case ${summons.caseNumber} has been served successfully.`,
        relatedCase: summons.case,
        relatedCaseNumber: summons.caseNumber
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service recorded successfully',
      data: { summons }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark Service as Failed
exports.markServiceFailed = async (req, res) => {
  try {
    const { summonsId } = req.params;
    const { reason, reasonCode, attemptDate, nextAction, notes } = req.body;

    const summons = await Summons.findById(summonsId);

    if (!summons) {
      return res.status(404).json({
        success: false,
        message: 'Summons not found'
      });
    }

    const failureReason = reason || notes;
    if (!failureReason) {
      return res.status(400).json({
        success: false,
        message: 'A failed-service reason is required.'
      });
    }

    summons.status = 'Failed';
    const reasonPayload = {
      reason: failureReason,
      reasonCode: reasonCode || 'OTHER',
      attemptDate: attemptDate || new Date().toISOString(),
      nextAction: nextAction || null,
      recordedBy: req.user._id,
      recordedAt: new Date()
    };
    summons.serviceNotes = `FAILED_SERVICE:${safeJsonString(reasonPayload) || failureReason}`;

    await summons.save();

    res.status(200).json({
      success: true,
      message: 'Service marked as failed',
      data: { summons }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Bailiff Service SLA Summary
exports.getServiceSla = async (req, res) => {
  try {
    const bailiffId = req.user._id;
    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    const pending = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: { $in: ['Pending', 'In Progress'] }
    });

    const dueSoon = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: { $in: ['Pending', 'In Progress'] },
      createdAt: { $lte: fortyEightHoursAgo, $gt: seventyTwoHoursAgo }
    });

    const overdue = await Summons.countDocuments({
      assignedTo: bailiffId,
      status: { $in: ['Pending', 'In Progress'] },
      createdAt: { $lte: seventyTwoHoursAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        pending,
        dueSoon,
        overdue,
        thresholds: {
          dueSoonHours: 48,
          overdueHours: 72
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

// Create Summons (usually done by secretary/clerk)
exports.createSummons = async (req, res) => {
  try {
    const { caseId, issuedTo, summonsType, assignedTo } = req.body;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const summons = await Summons.create({
      case: caseId,
      caseNumber: caseData.caseNumber,
      issuedTo,
      summonsType,
      issuedBy: req.user._id,
      assignedTo: assignedTo || req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Summons created successfully',
      data: { summons }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = exports;