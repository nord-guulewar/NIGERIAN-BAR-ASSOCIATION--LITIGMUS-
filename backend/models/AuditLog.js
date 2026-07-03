const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: DataTypes.UUID,
  caseId: DataTypes.UUID,
  action: {
    type: DataTypes.ENUM(
      'caseCreated',
      'caseUpdated',
      'caseAssigned',
      'caseStatusChanged',
      'fileUploaded',
      'judgmentDelivered',
      'caseAdjourned',
      'caseTransferred',
      'caseNoteAdded',
      'staffNotified',
      'calendarEventAdded',
      'fineImposed'
    ),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  underscored: false
});

module.exports = createAdapter(AuditLog);
module.exports.Model = AuditLog;
