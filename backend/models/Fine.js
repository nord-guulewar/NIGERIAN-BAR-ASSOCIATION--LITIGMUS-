const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Fine = sequelize.define('Fine', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  caseId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  caseNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  suitNumber: DataTypes.STRING,
  imposedBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  imposedByName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  finedParty: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  amount: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 0
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Waived', 'Overdue'),
    defaultValue: 'Pending'
  },
  paymentDate: DataTypes.DATE,
  paymentReceiptNumber: DataTypes.STRING,
  courtType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  notes: DataTypes.TEXT
}, {
  tableName: 'fines',
  underscored: false
});

module.exports = createAdapter(Fine);
module.exports.Model = Fine;
