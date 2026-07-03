const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendJudgmentDelivered } = require('../utils/whatsappService');

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

// Helper function to notify relevant staff
const notifyStaff = async (caseData, notificationType, title, message) => {
  try {
    // Find registrar, secretary, and records officer for the same court/state
    const staffToNotify = await User.find({
      role: { $in: ['registrar', 'secretary', 'record_officer'] },
      state: caseData.state,
      court: caseData.courtType,
      isActive: true
    });

    // Create notifications for each staff member
    for (const staff of staffToNotify) {
      await createNotification(
        staff._id,
        notificationType,
        title,
        message,
        caseData._id,
        caseData.caseNumber
      );
    }
  } catch (error) {
    console.error('Error notifying staff:', error);
  }
};

// Get Judge Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get cases assigned to this judge
    const totalCases = await Case.countDocuments({ assignedJudge: judgeId });
    
    const pendingCases = await Case.countDocuments({ 
      assignedJudge: judgeId, 
      status: { $in: ['Pending', 'In Progress'] }
    });

    const todaysCases = await Case.countDocuments({
      assignedJudge: judgeId,
      'hearingDates.date': { $gte: today, $lt: tomorrow },
      'hearingDates.status': 'Scheduled'
    });

    const completedCases = await Case.countDocuments({
      assignedJudge: judgeId,
      status: { $in: ['Closed', 'Dismissed', 'Settled'] }
    });

    const adjournedCases = await Case.countDocuments({
      assignedJudge: judgeId,
      status: 'Adjourned'
    });

    // Get time-based greeting
    const hour = new Date().getHours();
    let greeting = 'Good Evening';
    if (hour < 12) greeting = 'Good Morning';
    else if (hour < 17) greeting = 'Good Afternoon';

    res.status(200).json({
      success: true,
      data: {
        greeting,
        judge: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          role: req.user.role,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          totalCases,
          pendingCases,
          todaysCases,
          completedCases,
          adjournedCases
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

// Get Judge's Assigned Cases with pagination
exports.getAssignedCases = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    const query = { assignedJudge: judgeId };
    if (status) query.status = status;

    const cases = await Case.find(query)
      .sort({ filingDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('registeredBy', 'firstName lastName')
      .populate('assignedBy', 'firstName lastName');

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

// Get Today's Cases (max 15 per day)
exports.getTodaysCases = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cases = await Case.find({
      assignedJudge: judgeId,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: tomorrow },
          status: 'Scheduled'
        }
      }
    })
    .limit(15)
    .sort({ 'hearingDates.date': 1 })
    .populate('registeredBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: {
        cases,
        count: cases.length,
        maxPerDay: 15
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Deliver Judgment
exports.deliverJudgment = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { judgmentText, verdict } = req.body;
    const judgeId = req.user._id;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.assignedJudge.toString() !== judgeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to deliver judgment on this case'
      });
    }

    // Update case with judgment
    caseData.judgment = {
      text: judgmentText,
      deliveredBy: judgeId,
      deliveredDate: new Date(),
      verdict
    };
    caseData.status = 'Judgement Reserved';
    caseData.lastModifiedBy = judgeId;

    await caseData.save();

    // Notify staff
    await notifyStaff(
      caseData,
      'judgment_delivered',
      `Judgment Delivered - ${caseData.caseNumber}`,
      `Justice ${req.user.firstName} ${req.user.lastName} has delivered judgment on case ${caseData.caseNumber}: ${caseData.title}`
    );

    // Send WhatsApp notifications to lawyers
    const judgeName = `${req.user.firstName} ${req.user.lastName}`;
    const lawyerPhoneNumbers = [];
    
    if (caseData.plaintiff?.lawyer?.phoneNumber) {
      lawyerPhoneNumbers.push(caseData.plaintiff.lawyer.phoneNumber);
    }
    if (caseData.defendant?.lawyer?.phoneNumber) {
      lawyerPhoneNumbers.push(caseData.defendant.lawyer.phoneNumber);
    }

    // Send WhatsApp to all lawyers (fire and forget)
    lawyerPhoneNumbers.forEach(phoneNumber => {
      sendJudgmentDelivered(phoneNumber, caseData, judgeName).catch(err => {
        console.error('WhatsApp notification error:', err);
      });
    });

    res.status(200).json({
      success: true,
      message: 'Judgment delivered successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Adjourn Case
exports.adjournCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reason, nextHearingDate } = req.body;
    const judgeId = req.user._id;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.assignedJudge.toString() !== judgeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to adjourn this case'
      });
    }

    // Find staff to notify
    const staffToNotify = await User.find({
      role: { $in: ['registrar', 'secretary', 'record_officer'] },
      state: caseData.state,
      court: caseData.courtType,
      isActive: true
    });

    const notifiedUsers = staffToNotify.map(staff => ({
      user: staff._id,
      role: staff.role,
      notifiedAt: new Date()
    }));

    // Add adjournment record
    caseData.adjournments.push({
      reason,
      adjournedBy: judgeId,
      adjournedDate: new Date(),
      nextHearingDate: new Date(nextHearingDate),
      notifiedUsers
    });

    // Update case status
    caseData.status = 'Adjourned';
    caseData.lastModifiedBy = judgeId;

    // Add new hearing date
    caseData.hearingDates.push({
      date: new Date(nextHearingDate),
      status: 'Scheduled',
      notes: `Adjourned from previous hearing. Reason: ${reason}`
    });

    await caseData.save();

    // Notify staff
    await notifyStaff(
      caseData,
      'case_adjourned',
      `Case Adjourned - ${caseData.caseNumber}`,
      `Justice ${req.user.firstName} ${req.user.lastName} has adjourned case ${caseData.caseNumber} to ${new Date(nextHearingDate).toLocaleDateString()}. Reason: ${reason}`
    );

    // Send WhatsApp notifications to lawyers for adjournment
    const judgeName = `${req.user.firstName} ${req.user.lastName}`;
    const lawyerPhoneNumbers = [];
    
    if (caseData.plaintiff?.lawyer?.phoneNumber) {
      lawyerPhoneNumbers.push(caseData.plaintiff.lawyer.phoneNumber);
    }
    if (caseData.defendant?.lawyer?.phoneNumber) {
      lawyerPhoneNumbers.push(caseData.defendant.lawyer.phoneNumber);
    }

    lawyerPhoneNumbers.forEach(phoneNumber => {
      sendWhatsAppMessage(phoneNumber, 
        `🏛️ *NBA LITIGMUS*\n\nCase ${caseData.caseNumber} has been adjourned.\n\n📅 *New Date:* ${new Date(nextHearingDate).toLocaleDateString('en-NG')}\n📝 *Reason:* ${reason}\n👨‍⚖️ *By:* ${judgeName}\n\nPlease take note.`
      ).catch(err => console.error('WhatsApp adjournment error:', err));
    });

    res.status(200).json({
      success: true,
      message: 'Case adjourned successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Transfer Case to Another Judge
exports.transferCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { toJudgeId, reason } = req.body;
    const judgeId = req.user._id;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.assignedJudge.toString() !== judgeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to transfer this case'
      });
    }

    // Verify target judge exists and is available
    const targetJudge = await User.findOne({
      _id: toJudgeId,
      role: 'judge',
      isActive: true
    });

    if (!targetJudge) {
      return res.status(404).json({
        success: false,
        message: 'Target judge not found or not available'
      });
    }

    // Check if target judge has less than 15 cases today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const targetJudgeTodaysCases = await Case.countDocuments({
      assignedJudge: toJudgeId,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: tomorrow },
          status: 'Scheduled'
        }
      }
    });

    if (targetJudgeTodaysCases >= 15) {
      return res.status(400).json({
        success: false,
        message: `Judge ${targetJudge.firstName} ${targetJudge.lastName} has reached the maximum of 15 cases for today`
      });
    }

    // Record transfer
    caseData.caseTransfers.push({
      fromJudge: judgeId,
      toJudge: toJudgeId,
      reason,
      transferDate: new Date(),
      transferredBy: judgeId
    });

    // Update assigned judge
    caseData.assignedJudge = toJudgeId;
    caseData.assignedDate = new Date();
    caseData.lastModifiedBy = judgeId;

    await caseData.save();

    // Notify new judge
    await createNotification(
      toJudgeId,
      'case_assigned',
      `New Case Assigned - ${caseData.caseNumber}`,
      `Case ${caseData.caseNumber}: ${caseData.title} has been transferred to you by Justice ${req.user.firstName} ${req.user.lastName}. Reason: ${reason}`,
      caseData._id,
      caseData.caseNumber
    );

    // Notify staff
    await notifyStaff(
      caseData,
      'case_transferred',
      `Case Transferred - ${caseData.caseNumber}`,
      `Case ${caseData.caseNumber} has been transferred from Justice ${req.user.firstName} ${req.user.lastName} to Justice ${targetJudge.firstName} ${targetJudge.lastName}`
    );

    res.status(200).json({
      success: true,
      message: 'Case transferred successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Available Judges for Transfer
exports.getAvailableJudges = async (req, res) => {
  try {
    const judgeId = req.user._id;
    const { courtType, state } = req.query;

    // Find other judges in the same court/state
    const judges = await User.find({
      role: 'judge',
      _id: { $ne: judgeId },
      isActive: true,
      ...(courtType && { court: courtType }),
      ...(state && { state })
    }).select('firstName lastName court state supremeCourtNumber');

    // Get case count for each judge today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const judgesWithCaseCount = await Promise.all(
      judges.map(async (judge) => {
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
          court: judge.court,
          state: judge.state,
          supremeCourtNumber: judge.supremeCourtNumber,
          todaysCases,
          available: todaysCases < 15
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        judges: judgesWithCaseCount.filter(j => j.available)
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
    const judgeId = req.user._id;

    const caseData = await Case.findById(caseId)
      .populate('assignedJudge', 'firstName lastName supremeCourtNumber')
      .populate('registeredBy', 'firstName lastName role')
      .populate('assignedBy', 'firstName lastName role')
      .populate('adjournments.adjournedBy', 'firstName lastName')
      .populate('adjournments.notifiedUsers.user', 'firstName lastName role')
      .populate('caseTransfers.fromJudge', 'firstName lastName')
      .populate('caseTransfers.toJudge', 'firstName lastName')
      .populate('judgment.deliveredBy', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (caseData.assignedJudge._id.toString() !== judgeId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this case'
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

module.exports = exports;
