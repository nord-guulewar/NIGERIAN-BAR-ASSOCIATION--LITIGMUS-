const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Summons = sequelize.define('Summons', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  case: {
    type: DataTypes.UUID,
    allowNull: false
  },
  caseNumber: DataTypes.STRING,
  issuedTo: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  summonsType: {
    type: DataTypes.ENUM('Initial Summons', 'Witness Summons', 'Contempt Summons', 'Enforcement Order'),
    allowNull: false
  },
  issuedBy: DataTypes.UUID,
  assignedTo: DataTypes.UUID,
  serviceMethod: {
    type: DataTypes.ENUM('Personal Service', 'Substituted Service', 'Service by Publication', 'Electronic Service')
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Served', 'Failed', 'Returned Unserved'),
    defaultValue: 'Pending'
  },
  serviceDate: DataTypes.DATE,
  serviceLocation: DataTypes.STRING,
  serviceNotes: DataTypes.TEXT,
  proofOfService: DataTypes.STRING
}, {
  tableName: 'summons',
  underscored: false
});

module.exports = createAdapter(Summons);
module.exports.Model = Summons;
