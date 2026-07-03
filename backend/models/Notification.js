const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  recipient: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sender: DataTypes.UUID,
  type: {
    type: DataTypes.ENUM('case_assigned', 'judgment_delivered', 'case_adjourned', 'case_transferred', 'hearing_scheduled', 'document_uploaded', 'case_status_changed'),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  relatedCase: DataTypes.UUID,
  relatedCaseNumber: DataTypes.STRING,
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  readAt: DataTypes.DATE,
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'notifications',
  underscored: false
});

module.exports = createAdapter(Notification);
module.exports.Model = Notification;
