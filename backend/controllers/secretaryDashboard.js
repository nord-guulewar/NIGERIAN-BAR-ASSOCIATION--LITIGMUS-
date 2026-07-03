const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendWhatsAppMessage } = require('../utils/whatsappService');

// Helper to send email/SMS to lawyers
const notifyLawyer = async (lawyerInfo, subject, message, caseNumber, phoneNumber) => {
  // Send WhatsApp if phone number available
  if (phoneNumber) {
    await sendWhatsAppMessage(phoneNumber, message);
  }
  
  // Log the notification
  console.log(`Notification to ${lawyerInfo.name} (${lawyerInfo.email || phoneNumber}): ${subject}`);

  return {
    sent: true,
    recipient: lawyerInfo.name,
    email: lawyerInfo.email,
    phone: phoneNumber,
    subject,
    message: message.substring(0, 100) + '...',
    caseNumber,
    sentAt: new Date()
  };
};

// Get Secretary Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const secretaryState = req.user.state;
    const secretaryCourt = req.user.court;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get hearings scheduled for today
    const todaysHearings = await Case.countDocuments({
      state: secretaryState,
      courtType: secretaryCourt,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: tomorrow },
          status: 'Scheduled'
        }
      }
    });

    // Get pending notifications
    const pendingNotifications = await Notification.countDocuments({
      recipient: req.user._id,
      read: false
    });

    // Get cases needing scheduling
    const needsScheduling = await Case.countDocuments({
      state: secretaryState,
      courtType: secretaryCourt,
      assignedJudge: { $ne: null },
      hearingDates: { $size: 0 }
    });

    // Get upcoming hearings (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingHearings = await Case.countDocuments({
      state: secretaryState,
      courtType: secretaryCourt,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: nextWeek },
          status: 'Scheduled'
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        secretary: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          todaysHearings,
          pendingNotifications,
          needsScheduling,
          upcomingHearings
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

// Get Today's Hearings (Cause List)
exports.getTodaysHearings = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: tomorrow },
          status: 'Scheduled'
        }
      }
    })
      .populate('assignedJudge', 'firstName lastName')
      .sort({ 'hearingDates.time': 1 });

    // Format cause list
    const causeList = cases.map(c => {
      const todaysHearing = c.hearingDates.find(h => {
        const hDate = new Date(h.date);
        return hDate >= today && hDate < tomorrow && h.status === 'Scheduled';
      });

      return {
        caseNumber: c.caseNumber,
        title: c.title,
        caseType: c.caseType,
        plaintiff: c.plaintiff.name,
        plaintiffLawyer: c.plaintiff.lawyer?.name || 'Self-represented',
        defendant: c.defendant.name,
        defendantLawyer: c.defendant.lawyer?.name || 'Self-represented',
        judge: c.assignedJudge ? `${c.assignedJudge.firstName} ${c.assignedJudge.lastName}` : 'Not assigned',
        time: todaysHearing?.time || 'TBA',
        status: c.status
      };
    });

    res.status(200).json({
      success: true,
      data: {
        date: today,
        count: causeList.length,
        causeList
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Schedule Hearing
exports.scheduleHearing = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { hearingDate, hearingTime, notes } = req.body;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Add hearing date
    caseData.hearingDates.push({
      date: new Date(hearingDate),
      time: hearingTime,
      status: 'Scheduled',
      notes: notes || 'Hearing scheduled by court secretary'
    });

    caseData.lastModifiedBy = req.user._id;
    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Hearing scheduled successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Notify Lawyers about Hearing
exports.notifyLawyers = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { notificationType } = req.body; // 'initial', 'reminder', 'adjournment'

    const caseData = await Case.findById(caseId)
      .populate('assignedJudge', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Get next hearing
    const nextHearing = caseData.hearingDates
      .filter(h => h.status === 'Scheduled' && new Date(h.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

    if (!nextHearing) {
      return res.status(400).json({
        success: false,
        message: 'No upcoming hearing scheduled'
      });
    }

    const hearingDateStr = new Date(nextHearing.date).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const judgeName = caseData.assignedJudge 
      ? `Hon. Justice ${caseData.assignedJudge.firstName} ${caseData.assignedJudge.lastName}`
      : 'To be assigned';

    const notifications = [];

    // Notify Plaintiff's Lawyer
    if (caseData.plaintiff.lawyer && caseData.plaintiff.lawyer.email) {
      const subject = notificationType === 'adjournment' 
        ? `Case Adjourned - ${caseData.caseNumber}`
        : notificationType === 'reminder'
        ? `Hearing Reminder - ${caseData.caseNumber}`
        : `Hearing Notice - ${caseData.caseNumber}`;

      const message = `
Dear ${caseData.plaintiff.lawyer.name},

Case Number: ${caseData.caseNumber}
Case Title: ${caseData.title}
Your Client: ${caseData.plaintiff.name} (Plaintiff)

${notificationType === 'adjournment' 
  ? 'This is to inform you that the above case has been adjourned to:'
  : notificationType === 'reminder'
  ? 'This is a reminder that the above case is scheduled for hearing on:'
  : 'This is to inform you that the above case has been scheduled for hearing on:'}

Date: ${hearingDateStr}
Time: ${nextHearing.time}
Court: ${caseData.courtType}
Before: ${judgeName}

Please ensure your attendance and that of your client.

Issued by: ${req.user.firstName} ${req.user.lastName}
Court Secretary
${caseData.courtType}, ${caseData.state}
      `.trim();

      const notification = await notifyLawyer(
        caseData.plaintiff.lawyer,
        subject,
        message,
        caseData.caseNumber,
        caseData.plaintiff.lawyer.phoneNumber
      );
      notifications.push({ party: 'Plaintiff', ...notification });
    }

    // Notify Defendant's Lawyer
    if (caseData.defendant.lawyer && caseData.defendant.lawyer.email) {
      const subject = notificationType === 'adjournment' 
        ? `Case Adjourned - ${caseData.caseNumber}`
        : notificationType === 'reminder'
        ? `Hearing Reminder - ${caseData.caseNumber}`
        : `Hearing Notice - ${caseData.caseNumber}`;

      const message = `
Dear ${caseData.defendant.lawyer.name},

Case Number: ${caseData.caseNumber}
Case Title: ${caseData.title}
Your Client: ${caseData.defendant.name} (Defendant)

${notificationType === 'adjournment' 
  ? 'This is to inform you that the above case has been adjourned to:'
  : notificationType === 'reminder'
  ? 'This is a reminder that the above case is scheduled for hearing on:'
  : 'This is to inform you that the above case has been scheduled for hearing on:'}

Date: ${hearingDateStr}
Time: ${nextHearing.time}
Court: ${caseData.courtType}
Before: ${judgeName}

Please ensure your attendance and that of your client.

Issued by: ${req.user.firstName} ${req.user.lastName}
Court Secretary
${caseData.courtType}, ${caseData.state}
      `.trim();

      const notification = await notifyLawyer(
        caseData.defendant.lawyer,
        subject,
        message,
        caseData.caseNumber,
        caseData.defendant.lawyer.phoneNumber
      );
      notifications.push({ party: 'Defendant', ...notification });
    }

    res.status(200).json({
      success: true,
      message: 'Lawyers notified successfully',
      data: {
        caseNumber: caseData.caseNumber,
        hearingDate: nextHearing.date,
        hearingTime: nextHearing.time,
        notifications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Send Hearing Reminders (Automated - can be called by cron job)
exports.sendHearingReminders = async (req, res) => {
  try {
    const { daysAhead } = req.query; // 7 days, 1 day, etc.
    const days = parseInt(daysAhead) || 7;

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: targetDate, $lt: nextDay },
          status: 'Scheduled'
        }
      }
    }).populate('assignedJudge', 'firstName lastName');

    const remindersSent = [];

    for (const caseData of cases) {
      const hearing = caseData.hearingDates.find(h => {
        const hDate = new Date(h.date);
        return hDate >= targetDate && hDate < nextDay && h.status === 'Scheduled';
      });

      if (!hearing) continue;

      const hearingDateStr = new Date(hearing.date).toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const judgeName = caseData.assignedJudge 
        ? `Hon. Justice ${caseData.assignedJudge.firstName} ${caseData.assignedJudge.lastName}`
        : 'To be assigned';

      // Notify both lawyers
      const notifications = [];

      if (caseData.plaintiff.lawyer?.email) {
        const message = `
Dear ${caseData.plaintiff.lawyer.name},

HEARING REMINDER

Case Number: ${caseData.caseNumber}
Case Title: ${caseData.title}
Your Client: ${caseData.plaintiff.name} (Plaintiff)

This is a reminder that the above case is scheduled for hearing in ${days} day(s):

Date: ${hearingDateStr}
Time: ${hearing.time}
Court: ${caseData.courtType}
Before: ${judgeName}

Please ensure your attendance and that of your client.

Court Secretary
${caseData.courtType}, ${caseData.state}
        `.trim();

await notifyLawyer(
          caseData.plaintiff.lawyer,
          `Hearing Reminder - ${caseData.caseNumber}`,
          message,
          caseData.caseNumber,
          caseData.plaintiff.lawyer.phoneNumber
        );
        notifications.push('Plaintiff Lawyer');
      }

      if (caseData.defendant.lawyer?.email) {
        const message = `
Dear ${caseData.defendant.lawyer.name},

HEARING REMINDER

Case Number: ${caseData.caseNumber}
Case Title: ${caseData.title}
Your Client: ${caseData.defendant.name} (Defendant)

This is a reminder that the above case is scheduled for hearing in ${days} day(s):

Date: ${hearingDateStr}
Time: ${hearing.time}
Court: ${caseData.courtType}
Before: ${judgeName}

Please ensure your attendance and that of your client.

Court Secretary
${caseData.courtType}, ${caseData.state}
        `.trim();

await notifyLawyer(
          caseData.defendant.lawyer,
          `Hearing Reminder - ${caseData.caseNumber}`,
          message,
          caseData.caseNumber,
          caseData.defendant.lawyer.phoneNumber
        );
        notifications.push('Defendant Lawyer');
      }

      remindersSent.push({
        caseNumber: caseData.caseNumber,
        hearingDate: hearing.date,
        notified: notifications
      });
    }

    res.status(200).json({
      success: true,
      message: `Sent ${remindersSent.length} hearing reminders`,
      data: {
        daysAhead: days,
        targetDate,
        remindersSent
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Upcoming Hearings
exports.getUpcomingHearings = async (req, res) => {
  try {
    const { days } = req.query;
    const daysAhead = parseInt(days) || 30;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: futureDate },
          status: 'Scheduled'
        }
      }
    })
      .populate('assignedJudge', 'firstName lastName')
      .sort({ 'hearingDates.date': 1 });

    const hearings = [];

    cases.forEach(c => {
      const upcomingHearings = c.hearingDates.filter(h => {
        const hDate = new Date(h.date);
        return hDate >= today && hDate < futureDate && h.status === 'Scheduled';
      });

      upcomingHearings.forEach(h => {
        hearings.push({
          caseNumber: c.caseNumber,
          title: c.title,
          caseType: c.caseType,
          plaintiff: c.plaintiff.name,
          plaintiffLawyer: c.plaintiff.lawyer?.name || 'Self-represented',
          defendant: c.defendant.name,
          defendantLawyer: c.defendant.lawyer?.name || 'Self-represented',
          judge: c.assignedJudge ? `${c.assignedJudge.firstName} ${c.assignedJudge.lastName}` : 'Not assigned',
          date: h.date,
          time: h.time,
          status: c.status
        });
      });
    });

    res.status(200).json({
      success: true,
      data: {
        period: `${daysAhead} days`,
        count: hearings.length,
        hearings: hearings.sort((a, b) => new Date(a.date) - new Date(b.date))
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
