const Case = require('../models/Case');
const User = require('../models/User');
const Fine = require('../models/Fine');
const Notification = require('../models/Notification');
const { sendWhatsAppMessage } = require('../utils/whatsappService');

// Helper: Create notification
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

// --- CASE NOTES ---
exports.addCaseNote = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { note } = req.body;
    const judgeId = req.user._id;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    if (caseData.assignedJudge?.toString() !== judgeId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this case' });
    }

    const judge = await User.findById(judgeId);
    judge.caseNotes.push({
      caseId,
      title: caseData.title,
      note,
      createdAt: new Date()
    });
    await judge.save();

    res.status(200).json({ success: true, message: 'Note saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCaseNotes = async (req, res) => {
  try {
    const judge = await User.findById(req.user._id).select('caseNotes');
    res.status(200).json({ success: true, data: { notes: judge.caseNotes || [] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- NOTIFICATION TO STAFF ---
exports.notifyCourtStaff = async (req, res) => {
  try {
    const { caseId, message, notifyRegistrar, notifyRecordsOfficer, notifyClerk } = req.body;
    const judgeId = req.user._id;

    const caseData = caseId ? await Case.findById(caseId) : null;
    const judge = await User.findById(judgeId);

    const rolesToNotify = [];
    if (notifyRegistrar) rolesToNotify.push('registrar');
    if (notifyRecordsOfficer) rolesToNotify.push('record_officer');
    if (notifyClerk) rolesToNotify.push('clerk');

    if (rolesToNotify.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one staff member to notify' });
    }

    const staff = await User.find({
      role: { $in: rolesToNotify },
      state: judge.state,
      court: judge.court,
      isActive: true
    });

    for (const person of staff) {
      await createNotification(
        person._id,
        'judge_message',
        `Message from Justice ${judge.firstName} ${judge.lastName}`,
        message,
        caseData?._id,
        caseData?.caseNumber,
        { fromJudge: judgeId, judgeName: `${judge.firstName} ${judge.lastName}` }
      );
    }

    res.status(200).json({
      success: true,
      message: `Notification sent to ${staff.length} staff member(s)`,
      notifiedCount: staff.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- CALENDAR / ABSENCE ---
exports.addCalendarEvent = async (req, res) => {
  try {
    const { title, date, type, description, notifyStaff } = req.body;
    const judgeId = req.user._id;

    const judge = await User.findById(judgeId);
    const eventDate = new Date(date);

    const event = {
      title,
      date: eventDate,
      type,
      description,
      notifiedStaff: []
    };

    if (notifyStaff) {
      const staff = await User.find({
        role: { $in: ['registrar', 'record_officer', 'clerk'] },
        state: judge.state,
        court: judge.court,
        isActive: true
      });

      for (const person of staff) {
        event.notifiedStaff.push({
          userId: person._id,
          role: person.role,
          notifiedAt: new Date()
        });

        const subject = type === 'absence'
          ? `Justice ${judge.firstName} ${judge.lastName} - Absence Notice`
          : `Calendar Event: ${title}`;

        await createNotification(
          person._id,
          type === 'absence' ? 'judge_absence' : 'calendar_event',
          subject,
          `Date: ${eventDate.toLocaleDateString()}\n${description}`,
          null,
          null,
          { judgeId, date: eventDate }
        );
      }
    }

    judge.calendarEvents.push(event);
    await judge.save();

    res.status(200).json({
      success: true,
      message: type === 'absence' ? 'Absence notice sent successfully' : 'Calendar event added',
      notifiedCount: event.notifiedStaff.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCalendarEvents = async (req, res) => {
  try {
    const judge = await User.findById(req.user._id).select('calendarEvents');
    const events = judge.calendarEvents || [];
    res.status(200).json({ success: true, data: { events } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FINES (Judge imposing fines) ---
exports.imposeFine = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { finedParty, amount, reason, dueDate } = req.body;
    const judgeId = req.user._id;

    const caseData = await Case.findById(caseId);
    if (!caseData) {
      return res.status(404).json({ success: false, message: 'Case not found' });
    }
    if (caseData.assignedJudge?.toString() !== judgeId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized for this case' });
    }

    const judge = await User.findById(judgeId);

    const fine = await Fine.create({
      caseId,
      caseNumber: caseData.caseNumber,
      suitNumber: caseData.suitNumber,
      imposedBy: judgeId,
      imposedByName: `Justice ${judge.firstName} ${judge.lastName}`,
      finedParty,
      amount,
      reason,
      dueDate: new Date(dueDate),
      courtType: caseData.courtType,
      state: caseData.state
    });

    // Notify accountant
    const accountants = await User.find({
      role: 'accountant',
      state: caseData.state,
      court: caseData.courtType,
      isActive: true
    });

    for (const acct of accountants) {
      await createNotification(
        acct._id,
        'fine_imposed',
        `Fine Imposed - ${caseData.caseNumber}`,
        `Justice ${judge.firstName} ${judge.lastName} imposed a fine of ₦${amount.toLocaleString()} on ${finedParty.name}. Reason: ${reason}`,
        caseData._id,
        caseData.caseNumber,
        { fineId: fine._id, amount, finedParty: finedParty.name }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Fine imposed successfully',
      data: { fine }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFinesImposed = async (req, res) => {
  try {
    const fines = await Fine.find({ imposedBy: req.user._id })
      .populate('caseId', 'title caseNumber')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: { fines } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- ACCOUNTANT FINE ACCESS ---
exports.getAllFinesForAccountant = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {
      state: req.user.state,
      courtType: req.user.court
    };
    if (status) query.status = status;

    const fines = await Fine.find(query)
      .populate('caseId', 'title caseNumber suitNumber')
      .populate('imposedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: { fines } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFineStatus = async (req, res) => {
  try {
    const { fineId } = req.params;
    const { status, paymentReceiptNumber } = req.body;

    const fine = await Fine.findById(fineId);
    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine not found' });
    }

    if (fine.state !== req.user.state || fine.courtType !== req.user.court) {
      return res.status(403).json({ success: false, message: 'Not authorized for this court' });
    }

    fine.status = status;
    if (status === 'Paid') {
      fine.paymentDate = new Date();
      fine.paymentReceiptNumber = paymentReceiptNumber;
    }
    await fine.save();

    res.status(200).json({
      success: true,
      message: `Fine status updated to ${status}`,
      data: { fine }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
