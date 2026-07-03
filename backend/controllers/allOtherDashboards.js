const Case = require('../models/Case');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ResearchRequest = require('../models/ResearchRequest');
const SecurityLog = require('../models/SecurityLog');

exports.librarianDashboard = {
  getSummary: async (req, res) => {
    try {
      const pendingRequests = await ResearchRequest.countDocuments({
        assignedTo: req.user._id,
        status: { $in: ['Pending', 'In Progress'] }
      });

      const completedToday = await ResearchRequest.countDocuments({
        assignedTo: req.user._id,
        status: 'Completed',
        completedDate: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      });

      const totalCompleted = await ResearchRequest.countDocuments({
        assignedTo: req.user._id,
        status: 'Completed'
      });

      res.status(200).json({
        success: true,
        data: {
          librarian: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: { pendingRequests, completedToday, totalCompleted }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getResearchRequests: async (req, res) => {
    try {
      const { status } = req.query;
      const query = { assignedTo: req.user._id };
      if (status) query.status = status;

      const requests = await ResearchRequest.find(query)
        .populate('requestedBy', 'firstName lastName role')
        .populate('case', 'caseNumber title')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: { requests } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  submitResearch: async (req, res) => {
    try {
      const { requestId } = req.params;
      const { findings, references } = req.body;

      const request = await ResearchRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      request.status = 'Completed';
      request.findings = findings;
      request.references = references;
      request.completedDate = new Date();
      await request.save();

      // Notify requester
      await Notification.create({
        recipient: request.requestedBy,
        type: 'case_status_changed',
        title: 'Research Completed',
        message: `Your research request on "${request.topic}" has been completed.`,
        relatedCase: request.case
      });

      res.status(200).json({ success: true, message: 'Research submitted', data: { request } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== LITIGATION OFFICER DASHBOARD ====================

exports.litigationOfficerDashboard = {
  getSummary: async (req, res) => {
    try {
      const governmentCases = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        $or: [
          { 'plaintiff.name': /government|state|federal/i },
          { 'defendant.name': /government|state|federal/i }
        ]
      });

      const activeCases = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        status: { $in: ['Pending', 'In Progress'] },
        $or: [
          { 'plaintiff.name': /government|state|federal/i },
          { 'defendant.name': /government|state|federal/i }
        ]
      });

      res.status(200).json({
        success: true,
        data: {
          officer: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: { governmentCases, activeCases }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getGovernmentCases: async (req, res) => {
    try {
      const cases = await Case.find({
        state: req.user.state,
        courtType: req.user.court,
        $or: [
          { 'plaintiff.name': /government|state|federal/i },
          { 'defendant.name': /government|state|federal/i }
        ]
      })
        .populate('assignedJudge', 'firstName lastName')
        .sort({ filingDate: -1 });

      res.status(200).json({ success: true, data: { cases } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== PROSECUTOR DASHBOARD ====================

exports.prosecutorDashboard = {
  getSummary: async (req, res) => {
    try {
      const criminalCases = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        caseType: 'Criminal'
      });

      const activeProsecutions = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        caseType: 'Criminal',
        status: { $in: ['Pending', 'In Progress'] }
      });

      const convictions = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        caseType: 'Criminal',
        'judgment.verdict': 'In Favor of Plaintiff'
      });

      res.status(200).json({
        success: true,
        data: {
          prosecutor: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: { criminalCases, activeProsecutions, convictions }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getCriminalCases: async (req, res) => {
    try {
      const cases = await Case.find({
        state: req.user.state,
        courtType: req.user.court,
        caseType: 'Criminal'
      })
        .populate('assignedJudge', 'firstName lastName')
        .sort({ filingDate: -1 });

      res.status(200).json({ success: true, data: { cases } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== PROBATE OFFICER DASHBOARD ====================

exports.probateOfficerDashboard = {
  getSummary: async (req, res) => {
    try {
      const probateCases = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        caseType: { $in: ['Probate', 'Family'] }
      });

      const pendingApplications = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        caseType: { $in: ['Probate', 'Family'] },
        status: 'Pending'
      });

      res.status(200).json({
        success: true,
        data: {
          officer: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: { probateCases, pendingApplications }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== COURT REPORTER DASHBOARD ====================

exports.courtReporterDashboard = {
  getSummary: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysHearings = await Case.countDocuments({
        state: req.user.state,
        courtType: req.user.court,
        'hearingDates': {
          $elemMatch: {
            date: { $gte: today, $lt: tomorrow },
            status: 'Scheduled'
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          reporter: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: { todaysHearings }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== USHER DASHBOARD ====================

exports.usherDashboard = {
  getSummary: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysHearings = await Case.find({
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
        data: {
          usher: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          todaysSchedule: todaysHearings
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== SECURITY OFFICER DASHBOARD ====================

exports.securityOfficerDashboard = {
  getSummary: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todaysLogs = await SecurityLog.countDocuments({
        officer: req.user._id,
        createdAt: { $gte: today, $lt: tomorrow }
      });

      const openIncidents = await SecurityLog.countDocuments({
        officer: req.user._id,
        resolved: false,
        incidentType: { $in: ['Security Alert', 'Incident Report', 'Emergency'] }
      });

      res.status(200).json({
        success: true,
        data: {
          officer: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: { todaysLogs, openIncidents }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  logIncident: async (req, res) => {
    try {
      const { incidentType, description, location, severity } = req.body;

      const log = await SecurityLog.create({
        officer: req.user._id,
        incidentType,
        description,
        location,
        severity
      });

      res.status(201).json({ success: true, message: 'Incident logged', data: { log } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

// ==================== ADMINISTRATOR DASHBOARD ====================

exports.administratorDashboard = {
  getSummary: async (req, res) => {
    try {
      const state = req.user.state;
      const court = req.user.court;

      // System-wide statistics
      const totalCases = await Case.countDocuments({ state, courtType: court });
      const activeCases = await Case.countDocuments({
        state,
        courtType: court,
        status: { $in: ['Pending', 'In Progress'] }
      });

      const totalStaff = await User.countDocuments({
        state,
        court,
        isActive: true
      });

      const totalJudges = await User.countDocuments({
        state,
        court,
        role: 'judge',
        isActive: true
      });

      // Get staff by role
      const staffByRole = await User.aggregate([
        { $match: { state, court, isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          administrator: {
            name: `${req.user.firstName} ${req.user.lastName}`,
            court: req.user.court,
            state: req.user.state
          },
          stats: {
            totalCases,
            activeCases,
            totalStaff,
            totalJudges,
            staffByRole
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getAllStaff: async (req, res) => {
    try {
      const staff = await User.find({
        state: req.user.state,
        court: req.user.court,
        isActive: true
      }).select('-password').sort({ role: 1, lastName: 1 });

      res.status(200).json({ success: true, data: { staff } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getSystemAnalytics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const query = {
        state: req.user.state,
        courtType: req.user.court
      };

      if (startDate && endDate) {
        query.filingDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const casesByType = await Case.aggregate([
        { $match: query },
        { $group: { _id: '$caseType', count: { $sum: 1 } } }
      ]);

      const casesByStatus = await Case.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      res.status(200).json({
        success: true,
        data: { casesByType, casesByStatus }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
