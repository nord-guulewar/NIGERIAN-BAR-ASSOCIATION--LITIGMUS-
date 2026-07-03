const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');

const REQUIRED_DOCUMENTS_BY_CASE_TYPE = {
  Civil: ['Statement of Claim', 'Witness Statement', 'List of Documents'],
  Criminal: ['Charge Sheet', 'Proof of Evidence', 'Witness List'],
  Family: ['Petition', 'Marriage Certificate', 'Supporting Affidavit'],
  Commercial: ['Statement of Claim', 'Contract Documents', 'Board Resolution'],
  Land: ['Title Documents', 'Survey Plan', 'Witness Statement'],
  Probate: ['Application Form', 'Death Certificate', 'Will or Letters of Administration'],
  Other: ['Originating Process', 'Supporting Documents']
};

// Helper to create notifications
const createNotification = async (recipientId, type, title, message, caseId, caseNumber) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedCase: caseId,
      relatedCaseNumber: caseNumber
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const getCaseChecklist = (caseData) => {
  const defaultRequired = REQUIRED_DOCUMENTS_BY_CASE_TYPE[caseData.caseType] || REQUIRED_DOCUMENTS_BY_CASE_TYPE.Other;
  const storedChecklist = Array.isArray(caseData?.metadata?.filingChecklist)
    ? caseData.metadata.filingChecklist
    : null;

  const uploadedNames = new Set(
    (Array.isArray(caseData.documents) ? caseData.documents : [])
      .map((doc) => String(doc?.name || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const baseChecklist = storedChecklist && storedChecklist.length > 0
    ? storedChecklist
    : defaultRequired.map((name) => ({ name, required: true, provided: false }));

  const normalized = baseChecklist.map((item) => {
    const name = String(item?.name || '').trim();
    const required = item?.required !== false;
    const providedByUpload = uploadedNames.has(name.toLowerCase());
    const provided = Boolean(item?.provided) || providedByUpload;

    return {
      name,
      required,
      provided
    };
  }).filter((item) => item.name);

  const requiredItems = normalized.filter((item) => item.required);
  const providedRequiredCount = requiredItems.filter((item) => item.provided).length;
  const completionPercent = requiredItems.length === 0
    ? 100
    : Math.round((providedRequiredCount / requiredItems.length) * 100);

  const missingDocuments = requiredItems.filter((item) => !item.provided).map((item) => item.name);

  return {
    checklist: normalized,
    missingDocuments,
    completionPercent,
    complete: missingDocuments.length === 0
  };
};

// Get Clerk Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const clerkState = req.user.state;
    const clerkCourt = req.user.court;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Cases filed today
    const todaysFiled = await Case.countDocuments({
      state: clerkState,
      courtType: clerkCourt,
      filingDate: { $gte: today, $lt: tomorrow }
    });

    // Cases needing document verification
    const needsVerification = await Case.countDocuments({
      state: clerkState,
      courtType: clerkCourt,
      'documents': { $size: 0 }
    });

    // Today's hearings (for court proceedings)
    const todaysHearings = await Case.countDocuments({
      state: clerkState,
      courtType: clerkCourt,
      'hearingDates': {
        $elemMatch: {
          date: { $gte: today, $lt: tomorrow },
          status: 'Scheduled'
        }
      }
    });

    // Total cases managed
    const totalCases = await Case.countDocuments({
      state: clerkState,
      courtType: clerkCourt
    });

    res.status(200).json({
      success: true,
      data: {
        clerk: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          todaysFiled,
          needsVerification,
          todaysHearings,
          totalCases
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

// Upload Case Documents
exports.uploadDocuments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { documents } = req.body; // Array of {name, type, url}

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Add documents
    documents.forEach(doc => {
      caseData.documents.push({
        name: doc.name,
        type: doc.type,
        uploadDate: new Date(),
        uploadedBy: req.user._id
      });
    });

    caseData.lastModifiedBy = req.user._id;
    await caseData.save();

    // Notify records officer
    const recordsOfficers = await User.find({
      role: 'record_officer',
      state: caseData.state,
      court: caseData.courtType,
      isActive: true
    });

    for (const officer of recordsOfficers) {
      await createNotification(
        officer._id,
        'document_uploaded',
        `Documents Uploaded - ${caseData.caseNumber}`,
        `${documents.length} document(s) uploaded for case ${caseData.caseNumber}`,
        caseData._id,
        caseData.caseNumber
      );
    }

    res.status(200).json({
      success: true,
      message: 'Documents uploaded successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Record Court Proceedings
exports.recordProceedings = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { proceedings, hearingDate } = req.body;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Find the hearing and add notes
    const hearing = caseData.hearingDates.find(h => 
      new Date(h.date).toDateString() === new Date(hearingDate).toDateString()
    );

    if (hearing) {
      hearing.notes = proceedings;
    }

    caseData.lastModifiedBy = req.user._id;
    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Proceedings recorded successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Cases for Today's Hearings
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

    res.status(200).json({
      success: true,
      data: { cases, count: cases.length }
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
    const skip = (page - 1) * limit;

    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court
    })
      .sort({ filingDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedJudge', 'firstName lastName');

    const total = await Case.countDocuments({
      state: req.user.state,
      courtType: req.user.court
    });

    res.status(200).json({
      success: true,
      data: {
        cases,
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

// Get Filing Checklist for a Case
exports.getFilingChecklist = async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const checklistData = getCaseChecklist(caseData);

    res.status(200).json({
      success: true,
      data: {
        case: {
          _id: caseData._id,
          caseNumber: caseData.caseNumber,
          title: caseData.title,
          caseType: caseData.caseType,
          status: caseData.status
        },
        ...checklistData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update Filing Checklist for a Case
exports.updateFilingChecklist = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { checklist } = req.body;

    if (!Array.isArray(checklist) || checklist.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Checklist array is required.'
      });
    }

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    const normalizedChecklist = checklist
      .map((item) => ({
        name: String(item?.name || '').trim(),
        required: item?.required !== false,
        provided: Boolean(item?.provided)
      }))
      .filter((item) => item.name);

    caseData.metadata = {
      ...(caseData.metadata || {}),
      filingChecklist: normalizedChecklist,
      filingChecklistUpdatedAt: new Date(),
      filingChecklistUpdatedBy: req.user._id
    };
    caseData.lastModifiedBy = req.user._id;

    await caseData.save();

    const checklistData = getCaseChecklist(caseData);

    res.status(200).json({
      success: true,
      message: 'Filing checklist updated successfully',
      data: {
        caseId: caseData._id,
        ...checklistData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Incomplete Filings
exports.getIncompleteFilings = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court,
      status: { $in: ['Pending', 'In Progress'] }
    })
      .sort({ filingDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedJudge', 'firstName lastName');

    const formatted = cases
      .map((caseData) => {
        const checklistData = getCaseChecklist(caseData);
        return {
          _id: caseData._id,
          caseNumber: caseData.caseNumber,
          title: caseData.title,
          caseType: caseData.caseType,
          status: caseData.status,
          filingDate: caseData.filingDate,
          assignedJudge: caseData.assignedJudge,
          completionPercent: checklistData.completionPercent,
          missingDocuments: checklistData.missingDocuments,
          complete: checklistData.complete
        };
      })
      .filter((item) => !item.complete);

    const total = await Case.countDocuments({
      state: req.user.state,
      courtType: req.user.court,
      status: { $in: ['Pending', 'In Progress'] }
    });

    res.status(200).json({
      success: true,
      data: {
        cases: formatted,
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

module.exports = exports;
