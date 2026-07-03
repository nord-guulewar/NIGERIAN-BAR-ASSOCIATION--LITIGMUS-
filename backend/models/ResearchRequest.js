const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const ResearchRequest = sequelize.define('ResearchRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requestedBy: DataTypes.UUID,
  case: DataTypes.UUID,
  topic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  urgency: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
    defaultValue: 'Pending'
  },
  assignedTo: DataTypes.UUID,
  findings: DataTypes.TEXT,
  references: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  completedDate: DataTypes.DATE
}, {
  tableName: 'research_requests',
  underscored: false
});

module.exports = createAdapter(ResearchRequest);
module.exports.Model = ResearchRequest;
