const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Case = sequelize.define('Case', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  caseNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  suitNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  caseType: {
    type: DataTypes.ENUM('Civil', 'Criminal', 'Family', 'Commercial', 'Land', 'Constitutional', 'Labour', 'Tax', 'Maritime', 'Election', 'Other'),
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
  plaintiff: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  defendant: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  assignedJudge: DataTypes.UUID,
  assignedDate: DataTypes.DATE,
  assignedBy: DataTypes.UUID,
  filingDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  hearingDates: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Adjourned', 'Judgement Reserved', 'Closed', 'Dismissed', 'Settled'),
    defaultValue: 'Pending'
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Urgent'),
    defaultValue: 'Medium'
  },
  fees: {
    type: DataTypes.JSONB,
    defaultValue: {
      filingFee: { amount: 0, paid: false },
      hearingFee: { amount: 0, paid: false },
      processFee: { amount: 0, paid: false },
      bailiffFee: { amount: 0, paid: false },
      judgmentFee: { amount: 0, paid: false },
      totalAmount: 0,
      totalPaid: 0,
      paymentStatus: 'Unpaid',
      payments: []
    }
  },
  documents: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  judgment: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  adjournments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  caseTransfers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  notes: DataTypes.TEXT,
  registeredBy: {
    type: DataTypes.UUID,
    allowNull: false
  },
  lastModifiedBy: DataTypes.UUID,
  // Transaction tracking for payment verification workflow
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  paymentTransactionDetails: {
    type: DataTypes.JSONB,
    defaultValue: {
      status: 'PENDING', // PENDING, PENDING_VERIFICATION, VERIFIED, REJECTED
      amount: 0,
      method: null,
      uploadedBy: null,
      uploadedByName: null,
      uploadedAt: null,
      verifiedBy: null,
      verifiedByName: null,
      verifiedAt: null,
      rejectedBy: null,
      rejectedByName: null,
      rejectedAt: null,
      rejectionReason: null,
      approvalNotes: null
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'cases',
  underscored: false
});

module.exports = createAdapter(Case);
module.exports.Model = Case;