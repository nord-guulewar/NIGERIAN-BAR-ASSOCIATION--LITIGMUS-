const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Judge = sequelize.define('Judge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.ENUM('Justice', 'Judge', 'Chief Judge', 'Magistrate', 'Chief Magistrate'),
    defaultValue: 'Judge'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  courtType: {
    type: DataTypes.ENUM('SC', 'CA', 'FHC', 'SHC', 'SCA', 'CCA', 'MC', 'DC'),
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  specialization: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  maxDailyCases: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  retirementDate: DataTypes.DATE,
  currentCaseLoad: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalCasesHandled: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  availability: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: DataTypes.TEXT
}, {
  tableName: 'judges',
  underscored: false
});

Judge.prototype.canTakeCase = function() {
  return this.isActive && this.currentCaseLoad < this.maxDailyCases;
};

Judge.prototype.getFullName = function() {
  return `${this.title} ${this.firstName} ${this.lastName}`;
};

module.exports = createAdapter(Judge);
module.exports.Model = Judge;
