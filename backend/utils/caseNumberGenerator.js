const moment = require('moment');
const Case = require('../models/Case');

/**
 * Generate case number following Nigerian court format
 * Format: [COURT]/[STATE]/[LGA]/[YEAR]/[SEQUENCE]
 * Example: SHC/LA/IKJ/2024/001
 */
const generateCaseNumber = async (courtCode, stateCode, lgaCode, caseType) => {
  const year = moment().format('YYYY');
  
  // Find the last case number for this court/state/LGA/year combination
  const lastCase = await Case.findOne({
    courtType: courtCode,
    state: stateCode,
    caseNumber: new RegExp(`^${courtCode}/${stateCode}/${lgaCode}/${year}/`)
  }).sort({ caseNumber: -1 });
  
  let sequenceNumber = 1;
  
  if (lastCase && lastCase.caseNumber) {
    // Extract sequence number from last case
    const parts = lastCase.caseNumber.split('/');
    const lastSequence = parseInt(parts[parts.length - 1]);
    sequenceNumber = lastSequence + 1;
  }
  
  // Pad sequence to 3 digits
  const paddedSequence = String(sequenceNumber).padStart(3, '0');
  
  // Generate case number
  const caseNumber = `${courtCode}/${stateCode}/${lgaCode}/${year}/${paddedSequence}`;
  
  return {
    caseNumber,
    sequenceNumber,
    year
  };
};

const generateReceiptNumber = (paymentType, stateCode) => {
  const year = moment().format('YYYY');
  const month = moment().format('MM');
  const day = moment().format('DD');
  const timestamp = Date.now().toString().slice(-6);
  
  const typeCode = paymentType.substring(0, 3).toUpperCase();
  
  const receiptNumber = `RCP/${stateCode}/${typeCode}/${year}${month}${day}/${timestamp}`;
  
  return receiptNumber;
};

const parseStateCode = (stateName, states) => {
  const state = states.find(s => 
    s.name.toLowerCase() === stateName.toLowerCase() || 
    s.code.toLowerCase() === stateName.toLowerCase()
  );
  return state ? state.code : null;
};

/**
 * Generate suit number when case is assigned to a judge
 * Format: SUIT NO: [COURT]/[JUDGE_INITIALS]/[YEAR]/[SEQUENCE]
 * Example: SUIT NO: SHC/OAA/2024/125
 */
const generateSuitNumber = async (courtCode, judgeInitials, year) => {
  const currentYear = year || moment().format('YYYY');
  
  // Find the last suit number for this court/judge/year combination
  const lastCase = await Case.findOne({
    courtType: courtCode,
    suitNumber: new RegExp(`^${courtCode}/${judgeInitials}/${currentYear}/`)
  }).sort({ suitNumber: -1 });
  
  let sequenceNumber = 1;
  
  if (lastCase && lastCase.suitNumber) {
    // Extract sequence number from last suit
    const parts = lastCase.suitNumber.split('/');
    const lastSequence = parseInt(parts[parts.length - 1]);
    sequenceNumber = lastSequence + 1;
  }
  
  // Pad sequence to 3 digits
  const paddedSequence = String(sequenceNumber).padStart(3, '0');
  
  // Generate suit number
  const suitNumber = `${courtCode}/${judgeInitials}/${currentYear}/${paddedSequence}`;
  
  return {
    suitNumber,
    sequenceNumber,
    year: currentYear
  };
};

/**
 * Extract judge initials from name
 * Example: "Olukayode Ariwoola Adekunle" => "OAA"
 */
const getJudgeInitials = (firstName, lastName, middleName = '') => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const middle = middleName ? middleName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return middle ? `${first}${middle}${last}` : `${first}${last}`;
};

module.exports = {
  generateCaseNumber,
  generateReceiptNumber,
  parseStateCode,
  generateSuitNumber,
  getJudgeInitials
};
