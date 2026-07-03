const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Get Records Officer Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {
    const state = req.user.state;
    const court = req.user.court;

    // Cases needing archiving (closed cases)
    const needsArchiving = await Case.countDocuments({
      state,
      courtType: court,
      status: { $in: ['Closed', 'Dismissed', 'Settled'] },
      'metadata.archived': { $ne: true }
    });

    // Total archived cases
    const archivedCases = await Case.countDocuments({
      state,
      courtType: court,
      'metadata.archived': true
    });

    // Cases with documents
    const casesWithDocuments = await Case.countDocuments({
      state,
      courtType: court,
      'documents.0': { $exists: true }
    });

    // Total cases
    const totalCases = await Case.countDocuments({
      state,
      courtType: court
    });

    res.status(200).json({
      success: true,
      data: {
        officer: {
          name: `${req.user.firstName} ${req.user.lastName}`,
          court: req.user.court,
          state: req.user.state
        },
        stats: {
          needsArchiving,
          archivedCases,
          casesWithDocuments,
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

// Archive Case
exports.archiveCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { archiveLocation, notes } = req.body;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Update case metadata
    if (!caseData.metadata) caseData.metadata = {};
    caseData.metadata.archived = true;
    caseData.metadata.archiveDate = new Date();
    caseData.metadata.archiveLocation = archiveLocation;
    caseData.metadata.archiveNotes = notes;
    caseData.metadata.archivedBy = req.user._id;
    caseData.lastModifiedBy = req.user._id;

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Case archived successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Retrieve Archived Case
exports.retrieveCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { requestedBy, purpose } = req.body;

    const caseData = await Case.findById(caseId)
      .populate('assignedJudge', 'firstName lastName')
      .populate('registeredBy', 'firstName lastName');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    // Log retrieval
    if (!caseData.metadata) caseData.metadata = {};
    if (!caseData.metadata.retrievals) caseData.metadata.retrievals = [];
    
    caseData.metadata.retrievals.push({
      retrievedBy: req.user._id,
      requestedBy,
      purpose,
      retrievalDate: new Date()
    });

    await caseData.save();

    res.status(200).json({
      success: true,
      message: 'Case retrieved successfully',
      data: { case: caseData }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search Cases
exports.searchCases = async (req, res) => {
  try {
    const { query, archived } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const searchQuery = {
      state: req.user.state,
      courtType: req.user.court,
      $or: [
        { caseNumber: new RegExp(query, 'i') },
        { title: new RegExp(query, 'i') },
        { 'plaintiff.name': new RegExp(query, 'i') },
        { 'defendant.name': new RegExp(query, 'i') }
      ]
    };

    if (archived === 'true') {
      searchQuery['metadata.archived'] = true;
    }

    const cases = await Case.find(searchQuery)
      .sort({ filingDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedJudge', 'firstName lastName');

    const total = await Case.countDocuments(searchQuery);

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

// Get Cases Needing Archiving
exports.getCasesNeedingArchiving = async (req, res) => {
  try {
    const cases = await Case.find({
      state: req.user.state,
      courtType: req.user.court,
      status: { $in: ['Closed', 'Dismissed', 'Settled'] },
      'metadata.archived': { $ne: true }
    })
      .sort({ updatedAt: -1 })
      .populate('assignedJudge', 'firstName lastName');

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

module.exports = exports;
