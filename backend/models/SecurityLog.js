const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const SecurityLog = sequelize.define('SecurityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  officer: {
    type: DataTypes.UUID,
    allowNull: false
  },
  incidentType: {
    type: DataTypes.ENUM('Visitor Log', 'Security Alert', 'Incident Report', 'Access Denied', 'Emergency'),
    allowNull: false
  },
  description: DataTypes.TEXT,
  location: DataTypes.STRING,
  severity: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
    defaultValue: 'Low'
  },
  resolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'security_logs',
  underscored: false
});

module.exports = createAdapter(SecurityLog);
module.exports.Model = SecurityLog;
