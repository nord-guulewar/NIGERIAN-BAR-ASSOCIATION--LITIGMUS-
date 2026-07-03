const AuditLog = require('../models/AuditLog');

module.exports = (req, res, next) => {
  const logAction = (action, metadata) => {
    const logEntry = new AuditLog({
      userId: req.user ? req.user._id : null,
      action,
      metadata: { ...metadata }
    });
    logEntry.save();
  };

  // Attach logger to request for use in controllers
  req.audit = logAction;

  // Log case creation
  if (req.body && req.body.caseNumber) {
    logAction('caseCreated', { caseId: req.body._id });
  }

  // Log assignment
  if (req.body.assignedJudge) {
    logAction('caseAssigned', { 
      caseId: req.body._id, 
      judgeId: req.body.assignedJudge
    });
  }

  next();
};