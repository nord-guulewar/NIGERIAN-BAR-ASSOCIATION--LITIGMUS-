const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Docket = sequelize.define('Docket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  docketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  case: {
    type: DataTypes.UUID,
    allowNull: false
  },
  generatedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sentTo: {
    type: DataTypes.UUID,
    allowNull: false
  },
  sentToRole: {
    type: DataTypes.ENUM('judge', 'Justice', 'Magistrate', 'Chief Magistrate'),
    allowNull: false
  },
  court: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Acknowledged', 'In Review', 'Actioned', 'Returned'),
    defaultValue: 'Pending'
  },
  acknowledgedBy: DataTypes.UUID,
  acknowledgedAt: DataTypes.DATE,
  acknowledgmentNote: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium'
  },
  hearingDate: DataTypes.DATE,
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'dockets',
  underscored: false
});

module.exports = createAdapter(Docket);
module.exports.Model = Docket;
