const Case = require('../models/Case');
const Payment = require('../models/Payment');
const { calculateCaseFees, getAdditionalFees } = require('../config/courtFees');
const { generateReceiptNumber } = require('../utils/caseNumberGenerator');

const calculateAndSetCaseFees = async (caseId) => {
  try {
    const caseData = await Case.findById(caseId);
    
    if (!caseData) {
      throw new Error('Case not found');
    }

    const feeStructure = calculateCaseFees(caseData.courtType, caseData.caseType);

    caseData.fees = {
      filingFee: {
        amount: feeStructure.filingFee,
        paid: false
      },
      hearingFee: {
        amount: feeStructure.hearingFee,
        paid: false
      },
      processFee: {
        amount: feeStructure.processFee,
        paid: false
      },
      bailiffFee: {
        amount: feeStructure.bailiffFee,
        paid: false
      },
      judgmentFee: {
        amount: feeStructure.judgmentFee,
        paid: false
      },
      totalAmount: feeStructure.totalAmount,
      totalPaid: 0,
      paymentStatus: 'Unpaid',
      payments: []
    };

    await caseData.save();
    return caseData;
  } catch (error) {
    throw error;
  }
};

exports.getCaseFees = async (req, res) => {
  try {
    const { caseId } = req.params;
    
    const caseData = await Case.findById(caseId)
      .populate('fees.payments', 'amount paymentDate receiptNumber status');

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!caseData.fees || !caseData.fees.totalAmount) {
      await calculateAndSetCaseFees(caseId);
      const updatedCase = await Case.findById(caseId)
        .populate('fees.payments', 'amount paymentDate receiptNumber status');
      
      return res.status(200).json({
        success: true,
        data: {
          caseNumber: updatedCase.caseNumber,
          suitNumber: updatedCase.suitNumber,
          fees: updatedCase.fees
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        caseNumber: caseData.caseNumber,
        suitNumber: caseData.suitNumber,
        fees: caseData.fees
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.processCasePayment = async (req, res) => {
  try {
    const { caseId } = req.params;
    const {
      feeType,
      amount,
      paymentMethod,
      payer,
      description
    } = req.body;

    const caseData = await Case.findById(caseId);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        message: 'Case not found'
      });
    }

    if (!caseData.fees || !caseData.fees.totalAmount) {
      await calculateAndSetCaseFees(caseId);
    }

    const validFeeTypes = ['filingFee', 'hearingFee', 'processFee', 'bailiffFee', 'judgmentFee'];
    
    if (feeType && !validFeeTypes.includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee type'
      });
    }

    const receiptNumber = generateReceiptNumber('Court Fee', caseData.state);
    const transactionReference = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = await Payment.create({
      paymentType: feeType ? feeType.replace('Fee', ' Fee').replace(/([A-Z])/g, ' $1').trim() : 'Court Fee',
      amount,
      dueDate: new Date(),
      paymentDate: new Date(),
      paymentMethod,
      receiptNumber,
      transactionReference,
      relatedCase: caseId,
      state: caseData.state,
      courtType: caseData.courtType,
      payer,
      description: description || `Payment for ${caseData.caseNumber}`,
      status: 'Paid',
      processedBy: req.user._id
    });

    caseData.fees.payments.push(payment._id);
    caseData.fees.totalPaid += amount;

    if (feeType && caseData.fees[feeType]) {
      caseData.fees[feeType].paid = true;
    }

    if (caseData.fees.totalPaid >= caseData.fees.totalAmount) {
      caseData.fees.paymentStatus = 'Fully Paid';
    } else if (caseData.fees.totalPaid > 0) {
      caseData.fees.paymentStatus = 'Partially Paid';
    }

    await caseData.save();

    const populatedPayment = await Payment.findById(payment._id)
      .populate('relatedCase', 'caseNumber title suitNumber')
      .populate('processedBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        payment: populatedPayment,
        casePaymentStatus: {
          totalAmount: caseData.fees.totalAmount,
          totalPaid: caseData.fees.totalPaid,
          balance: caseData.fees.totalAmount - caseData.fees.totalPaid,
          paymentStatus: caseData.fees.paymentStatus
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getFeeStructure = async (req, res) => {
  try {
    const { courtType, caseType } = req.query;

    if (!courtType || !caseType) {
      return res.status(400).json({
        success: false,
        message: 'Court type and case type are required'
      });
    }

    const feeStructure = calculateCaseFees(courtType, caseType);

    res.status(200).json({
      success: true,
      data: {
        courtType,
        caseType,
        fees: feeStructure
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPaymentReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId)
      .populate('relatedCase', 'caseNumber title suitNumber plaintiff defendant courtType')
      .populate('processedBy', 'firstName lastName email role');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        receipt: {
          receiptNumber: payment.receiptNumber,
          transactionReference: payment.transactionReference,
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          currency: payment.currency,
          paymentMethod: payment.paymentMethod,
          paymentType: payment.paymentType,
          payer: payment.payer,
          case: payment.relatedCase,
          processedBy: payment.processedBy,
          status: payment.status
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  calculateAndSetCaseFees,
  getCaseFees: exports.getCaseFees,
  processCasePayment: exports.processCasePayment,
  getFeeStructure: exports.getFeeStructure,
  getPaymentReceipt: exports.getPaymentReceipt
};
