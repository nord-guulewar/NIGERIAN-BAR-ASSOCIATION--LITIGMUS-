const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { generateCaseNumber, generateSuitNumber, getJudgeInitials } = require('../utils/caseNumberGenerator');
const { calculateAndSetCaseFees } = require('./feeController');
const { sendCaseAssignment } = require('../utils/notificationService');

const MAX_JUDGE_CASES_PER_DAY = 15;
const DEFAULT_SCHEDULE_SLOTS = ['09:00', '10:30', '12:00', '13:30', '15:00'];

// Helper function to create notifications
const createNotification = async (recipientId, type, title, message, caseId, caseNumber, metadata = {}) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedCase: caseId,
      relatedCaseNumber: caseNumber,
      metadata
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const toDayWindow = (dateInput) => {
  const day = new Date(dateInput);
  if (Number.isNaN(day.getTime())) return null;
  day.setHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);
  return { day, nextDay };
};

const normalizeTime = (time) => {
  if (!time || typeof time !== 'string') return '';
  return time.trim();
};

const getJudgeDayCases = async (judgeId, hearingDate) => {
  const window = toDayWindow(hearingDate);
  if (!window) return [];

  return Case.find({
    assignedJudge: judgeId,
    hearingDates: {
      $elemMatch: {
        date: { $gte: window.day, $lt: window.nextDay },
        status: 'Scheduled'
      }
    }
  }).select('caseNumber title hearingDates');
};

const validateJudgeSchedule = async ({ judgeId, hearingDate, hearingTime, excludeCaseId = null }) => {
  const normalizedTime = normalizeTime(hearingTime);
  const window = toDayWindow(hearingDate);

  if (!window || !normalizedTime) {
    return {
      valid: false,
      message: 'Valid hearing date and hearing time are required.',
      reasons: ['invalid_datetime'],
      conflicts: [],
      casesOnDate: 0,
      availableSlots: []
    };
  }

  const dayCases = await getJudgeDayCases(judgeId, window.day);
  const filteredCases = excludeCaseId
    ? dayCases.filter((item) => String(item._id) !== String(excludeCaseId))
    : dayCases;

  const conflicts = [];
  const usedTimes = new Set();

  filteredCases.forEach((item) => {
    const hearings = Array.isArray(item.hearingDates) ? item.hearingDates : [];
    hearings.forEach((hearing) => {
      const hearingDateValue = new Date(hearing.date);
      if (
        hearing.status === 'Scheduled' &&
        hearingDateValue >= window.day &&
        hearingDateValue < window.nextDay
      ) {
        const usedTime = normalizeTime(hearing.time);
        if (usedTime) usedTimes.add(usedTime);

        if (usedTime === normalizedTime) {
          conflicts.push({
            caseId: item._id,
            caseNumber: item.caseNumber,
            title: item.title,
            date: hearingDateValue,
            time: usedTime
          });
        }
      }
    });
  });

  const casesOnDate = filteredCases.length;
  const capacityReached = casesOnDate >= MAX_JUDGE_CASES_PER_DAY;
  const availableSlots = DEFAULT_SCHEDULE_SLOTS.filter((slot) => !usedTimes.has(slot));

  const reasons = [];
  if (capacityReached) reasons.push('judge_daily_capacity_reached');
  if (conflicts.length > 0) reasons.push('time_conflict');

  return {
    valid: !capacityReached && conflicts.length === 0,
    message:
      capacityReached
        ? 'Judge has reached daily scheduling capacity.'
        : conflicts.length > 0
          ? 'Selected time conflicts with an already scheduled hearing.'
          : 'Selected hearing slot is available.',
    reasons,
    conflicts,
    casesOnDate,
    availableSlots
  };
};

// Get Registrar Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const registrarState = req.user.state;
    const registrarCourt = req.user.court;

    // Get statistics for this court/state
    const totalCases = await Case.countDocuments({
      state: registrarState,
      courtType: registrarCourt
    });

    const pendingAssignment = await Case.countDocuments({
      state: registrarState,
      courtType: registrarCourt,
      assignedJudge: null
    });

    const activeCases = await Case.countDocuments({
      state: registrarState,
      courtType: registrarCourt,
      status: { $in: ['Pending', 'In Progress'] }
    });

    const todaysFiled = await Case.countDocuments({
      state: registrarState,
      courtType: registrarCourt,
      filingDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    // Get judges and their case load
    const judges = await User.find({
      role: 'judge',
      state: registrarState,
      court: registrarCourt,
      isActive: true
    }).select('firstName lastName supremeCourtNumber');

    const judgesWithCaseLoad = await Promise.all(
      judges.map(async (judge) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const totalCases = await Case.countDocuments({ assignedJudge: judge._id });
        const todaysCases = await Case.countDocuments({
          assignedJudge: judge._id,
          'hearingDates': {
            $elemMatch: {
              date: { $gte: today, $lt: tomorrow },
              status: 'Scheduled'
            }
          }
        });

        return {
          _id: judge._id,
          name: `${judge.firstName} ${judge.lastName}`,
          supremeCourtNumber: judge.supremeCourtNumber,
          totalCases,
          todaysCases,
          available: todaysCases < 15,
          capacity: `${todaysCases}/15`
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        registrar: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state,
          lga: req.user.lga
        },
        stats: {
          totalCases,
          pendingAssignment,
          activeCases,
          todaysFiled
        },
        judges: judgesWithCaseLoad
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Generate Case Number and Register Case
exports.registerCase = async (req, res) => {
  try {
    const {
      title,
      caseType,
      plaintiff,
      defendant,
      filingFee,
      documents,
      notes,
      lgaCode
    } = req.body;

    const registrarId = req.user._id;
    const stateCode = req.user.state;
    const courtCode = req.user.court;
    const lga = lgaCode || req.user.lga;

    // Generate case number
    const { caseNumber, sequenceNumber, year } = await generateCaseNumber(
      courtCode,
      stateCode,
      lga,
      caseType
    );

    // Create case
    const newCase = await Case.create({
      caseNumber,
      title,
      caseType,
      courtType: courtCode,
      state: stateCode,
      plaintiff,
      defendant,
      documents,
      notes,
      registeredBy: registrarId,
      lastModifiedBy: registrarId
    });

    // Calculate and set fees automatically
    await calculateAndSetCaseFees(newCase._id);

    // Notify clerk
    const clerks = await User.find({
      role: 'clerk',
      state: stateCode,
      court: courtCode,
      isActive: true
    });

    for (const clerk of clerks) {
      await createNotification(
        clerk._id,
        'case_status_changed',
        `New Case Registered - ${caseNumber}`,
        `Case ${caseNumber}: ${title} has been registered and assigned case number.`,
        newCase._id,
        caseNumber
      );
    }

    res.status(201).json({
      success: true,
      message: 'Case registered successfully',
      data: {
        case: newCase,
        caseNumber,
        sequenceNumber,
        year
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Assign Case to Judge
exports.assignCaseToJudge = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { judgeId, hearingDate, hearingTime } = req.body;
    const registrarId = req.user._id;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Verify judge exists and is available
    const judge = await User.findOne({
      _id: judgeId,
      role: 'judge',
      isActive: true
    });

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found or not available'
      });
    }

    if (!hearingDate || !hearingTime) {
      return res.status(400).json({
        success: false,
        message: 'Hearing date and hearing time are required for assignment.'
      });
    }

    const hearingDateObj = new Date(`${hearingDate}T00:00:00`);
    const scheduleValidation = await validateJudgeSchedule({
      judgeId,
      hearingDate: hearingDateObj,
      hearingTime,
      excludeCaseId: caseId
    });

    if (!scheduleValidation.valid) {
      return res.status(400).json({
        success: false,
        message: scheduleValidation.message,
        data: {
          validation: scheduleValidation
        }
      });
    }

    // Generate suit number when assigning to judge
    const judgeInitials = getJudgeInitials(judge.firstName, judge.lastName);
    const { suitNumber } = await generateSuitNumber(
      caseData.courtType,
      judgeInitials,
      new Date().getFullYear()
    );

    // Assign case to judge
    caseData.assignedJudge = judgeId;
    caseData.assignedDate = new Date();
    caseData.assignedBy = registrarId;
    caseData.suitNumber = suitNumber;
    caseData.status = 'In Progress';
    caseData.lastModifiedBy = registrarId;

    // Add hearing date
    caseData.hearingDates.push({
      date: hearingDateObj,
      time: hearingTime,
      status: 'Scheduled',
      notes: 'Initial hearing'
    });

    await caseData.save();

    // Notify judge via in-app notification
    await createNotification(
      judgeId,
      'case_assigned',
      `New Case Assigned - ${suitNumber}`,
      `Suit No: ${suitNumber} (${caseData.caseNumber}): ${caseData.title} has been assigned to you. Hearing scheduled for ${hearingDate} at ${hearingTime}.`,
      caseData._id,
      caseData.caseNumber,
      { hearingDate, hearingTime, suitNumber }
    );

    // Send email notification to judge
    if (judge.email) {
      await sendCaseAssignment(
        judge.email,
        `${judge.firstName} ${judge.lastName}`,
        {
          caseNumber: caseData.caseNumber,
          title: caseData.title,
          caseType: caseData.caseType,
          court: caseData.courtType,
          suitNumber: suitNumber,
          hearingDate: hearingDate,
          hearingTime: hearingTime
        }
      );
    }

    // Notify secretary to schedule and notify lawyers
    const secretaries = await User.find({
      role: 'secretary',
      state: caseData.state,
      court: caseData.courtType,
      isActive: true
    });

    for (const secretary of secretaries) {
      await createNotification(
        secretary._id,
        'hearing_scheduled',
        `Schedule Hearing - ${caseData.caseNumber}`,
        `Please notify lawyers for case ${caseData.caseNumber}. Hearing: ${hearingDate} at ${hearingTime}.`,
        caseData._id,
        caseData.caseNumber,
        { hearingDate, hearingTime, plaintiff: caseData.plaintiff, defendant: caseData.defendant }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Case assigned to judge successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Pending Cases (Not Assigned)
exports.getPendingCases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court,
      assignedJudge: null
    })
      .sort({ filingDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('registeredBy', 'firstName lastName');

    const total = await Case.countDocuments({
      state: req.user.state,
      courtType: req.user.court,
      assignedJudge: null
    });

    res.status(200).json({
      success: true,
      data: {
        cases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// Get All Cases
exports.getAllCases = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const query = {
      state: req.user.state,
      courtType: req.user.court
    };

    if (status) query.status = status;

    const cases = await Case.find(query)
      .sort({ filingDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedJudge', 'firstName lastName supremeCourtNumber')
      .populate('registeredBy', 'firstName lastName');

    const total = await Case.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        cases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// Get Available Judges
exports.getAvailableJudges = async (req, res) => {
  try {
    const { date } = req.query;
    const checkDate = date ? new Date(date) : new Date();
    checkDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(checkDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const judges = await User.find({
      role: 'judge',
      state: req.user.state,
      court: req.user.court,
      isActive: true
    }).select('firstName lastName supremeCourtNumber');

    const judgesWithAvailability = await Promise.all(
      judges.map(async (judge) => {
        const casesOnDate = await Case.countDocuments({
          assignedJudge: judge._id,
          'hearingDates': {
            $elemMatch: {
              date: { $gte: checkDate, $lt: nextDay },
              status: 'Scheduled'
            }
          }
        });

        const totalCases = await Case.countDocuments({ assignedJudge: judge._id });

        return {
          _id: judge._id,
          name: `${judge.firstName} ${judge.lastName}`,
          supremeCourtNumber: judge.supremeCourtNumber,
          casesOnDate,
          totalCases,
          available: casesOnDate < 15,
          capacity: `${casesOnDate}/15`
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        date: checkDate,
        judges: judgesWithAvailability
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Case Details
exports.getCaseDetails = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseData = await Case.findById(caseId)
      .populate('assignedJudge', 'firstName lastName supremeCourtNumber')
      .populate('registeredBy', 'firstName lastName role')
      .populate('assignedBy', 'firstName lastName role')
      .populate('adjournments.adjournedBy', 'firstName lastName')
      .populate('judgment.deliveredBy', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
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
};

// Reassign Case to Different Judge
exports.reassignCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { newJudgeId, reason } = req.body;
    const registrarId = req.user._id;

    const caseData = await Case.findById(caseId)
      .populate('assignedJudge', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const oldJudge = caseData.assignedJudge;

    // Verify new judge
    const newJudge = await User.findOne({
      _id: newJudgeId,
      role: 'judge',
      isActive: true
    });

    if (!newJudge) {
      return res.status(404).json({
        success: false,
        message: 'New judge not found'
      });
    }

    // Record transfer
    caseData.caseTransfers.push({
      fromJudge: oldJudge._id,
      toJudge: newJudgeId,
      reason,
      transferDate: new Date(),
      transferredBy: registrarId
    });

    caseData.assignedJudge = newJudgeId;
    caseData.assignedDate = new Date();
    caseData.assignedBy = registrarId;
    caseData.lastModifiedBy = registrarId;

    await caseData.save();

    // Notify old judge
    if (oldJudge) {
      await createNotification(
        oldJudge._id,
        'case_transferred',
        `Case Reassigned - ${caseData.caseNumber}`,
        `Case ${caseData.caseNumber} has been reassigned to Justice ${newJudge.firstName} ${newJudge.lastName}. Reason: ${reason}`,
        caseData._id,
        caseData.caseNumber
      );
    }

    // Notify new judge
    await createNotification(
      newJudgeId,
      'case_assigned',
      `Case Assigned - ${caseData.caseNumber}`,
      `Case ${caseData.caseNumber}: ${caseData.title} has been assigned to you by the Registrar.`,
      caseData._id,
      caseData.caseNumber
    );

    res.status(200).json({
      success: true,
      message: 'Case reassigned successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.validateSchedule = async (req, res) => {
  try {
    const { caseId, judgeId, hearingDate, hearingTime } = req.body;

    if (!judgeId || !hearingDate || !hearingTime) {
      return res.status(400).json({
        success: false,
        message: 'judgeId, hearingDate and hearingTime are required.'
      });
    }

    const judge = await User.findOne({
      _id: judgeId,
      role: 'judge',
      state: req.user.state,
      court: req.user.court,
      isActive: true
    });

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found in registrar jurisdiction.'
      });
    }

    const validation = await validateJudgeSchedule({
      judgeId,
      hearingDate: new Date(`${hearingDate}T00:00:00`),
      hearingTime,
      excludeCaseId: caseId || null
    });

    res.status(200).json({
      success: true,
      data: {
        validation,
        judge: {
          _id: judge._id,
          name: `${judge.firstName} ${judge.lastName}`
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

exports.suggestScheduleSlots = async (req, res) => {
  try {
    const { judgeId, preferredDate } = req.body;

    if (!judgeId) {
      return res.status(400).json({
        success: false,
        message: 'judgeId is required.'
      });
    }

    const judge = await User.findOne({
      _id: judgeId,
      role: 'judge',
      state: req.user.state,
      court: req.user.court,
      isActive: true
    });

    if (!judge) {
      return res.status(404).json({
        success: false,
        message: 'Judge not found in registrar jurisdiction.'
      });
    }

    const start = preferredDate ? new Date(`${preferredDate}T00:00:00`) : new Date();
    start.setHours(0, 0, 0, 0);

    const suggestions = [];

    for (let dayOffset = 0; dayOffset < 7 && suggestions.length < 5; dayOffset += 1) {
      const date = new Date(start);
      date.setDate(start.getDate() + dayOffset);

      const window = toDayWindow(date);
      const dayCases = await getJudgeDayCases(judgeId, date);
      const casesOnDate = dayCases.length;

      if (casesOnDate >= MAX_JUDGE_CASES_PER_DAY) {
        continue;
      }

      const usedTimes = new Set();
      dayCases.forEach((item) => {
        const hearings = Array.isArray(item.hearingDates) ? item.hearingDates : [];
        hearings.forEach((hearing) => {
          const hearingDateValue = new Date(hearing.date);
          if (hearing.status === 'Scheduled' && hearingDateValue >= window.day && hearingDateValue < window.nextDay) {
            const usedTime = normalizeTime(hearing.time);
            if (usedTime) usedTimes.add(usedTime);
          }
        });
      });

      DEFAULT_SCHEDULE_SLOTS.forEach((slot) => {
        if (suggestions.length >= 5) return;
        if (!usedTimes.has(slot)) {
          suggestions.push({
            date,
            time: slot,
            casesOnDate,
            capacity: `${casesOnDate}/${MAX_JUDGE_CASES_PER_DAY}`
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        judge: {
          _id: judge._id,
          name: `${judge.firstName} ${judge.lastName}`
        },
        suggestions
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
