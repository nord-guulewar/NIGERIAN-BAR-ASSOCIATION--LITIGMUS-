const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/postgres');
const { createAdapter } = require('../db/adapters/sequelizeAdapter');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  paymentType: {
    type: DataTypes.ENUM('Filing Fee', 'Hearing Fee', 'Judgment Fee', 'Administrative Fee', 'Court Maintenance', 'Staff Salary', 'Utilities', 'Equipment', 'Other'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'NGN'
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Overdue', 'Cancelled', 'Refunded'),
    defaultValue: 'Pending'
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paymentDate: DataTypes.DATE,
  paymentMethod: {
    type: DataTypes.ENUM('Cash', 'Bank Transfer', 'Card', 'Cheque', 'Online', 'POS')
  },
  receiptNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  transactionReference: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  relatedCase: DataTypes.UUID,
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  courtType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  payer: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  description: DataTypes.TEXT,
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringFrequency: {
    type: DataTypes.ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually')
  },
  processedBy: DataTypes.UUID,
  notes: DataTypes.TEXT,
  banked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  bankingDate: DataTypes.DATE,
  receivedBy: DataTypes.UUID
}, {
  tableName: 'payments',
  underscored: false
});

Payment.prototype.isOverdue = function() {
  return this.status === 'Pending' && new Date() > new Date(this.dueDate);
};

module.exports = createAdapter(Payment);
module.exports.Model = Payment;
