const SibApiV3Sdk = require('@sendinblue/client');
const whatsappService = require('./whatsappService');

const getBrevo = () => {
  if (!process.env.BREVO_API_KEY) return null;
  const api = new SibApiV3Sdk.TransactionalEmailsApi();
  api.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  return api;
};

const resolveSenderEmail = () => {
  const configured = process.env.BREVO_SENDER_EMAIL;
  const fallback = 'noreply@nbalitigmus.ng';
  const isValid = configured && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configured);
  return isValid ? configured : fallback;
};

const sendEmail = async (to, subject, html, text) => {
  try {
    const api = getBrevo();
    if (api) {
      const email = new SibApiV3Sdk.SendSmtpEmail();
      email.sender = { email: resolveSenderEmail(), name: 'NBA LITIGMUS' };
      if (process.env.BREVO_SENDER_EMAIL) {
        email.replyTo = { email: process.env.BREVO_SENDER_EMAIL, name: 'NBA LITIGMUS Support' };
      }
      email.to = [{ email: to }];
      email.subject = subject;
      email.htmlContent = html;
      email.textContent = text;
      await api.sendTransacEmail(email);
      console.log(`✅ Email sent to ${to}: ${subject}`);
      return { success: true };
    }
    console.log(`📧 DEMO: Would send to ${to}: ${subject}`);
    return { success: true, demo: true };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.error('Error details:', error.response?.body || error.stack);
    return { success: false, error: error.message };
  }
};

// Case assignment notification
const sendCaseAssignment = async (judgeEmail, judgeName, caseData) => {
  const subject = `New Case Assigned - ${caseData.caseNumber}`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e3c72; color: white; padding: 20px; text-align: center;">
      <h2>NBA LITIGMUS</h2>
    </div>
    <div style="padding: 20px;">
      <h3>New Case Assignment</h3>
      <p>Hello ${judgeName},</p>
      <p>A new case has been assigned to you:</p>
      <ul>
        <li><strong>Case Number:</strong> ${caseData.caseNumber}</li>
        <li><strong>Title:</strong> ${caseData.title || 'N/A'}</li>
        <li><strong>Type:</strong> ${caseData.caseType || 'N/A'}</li>
        <li><strong>Court:</strong> ${caseData.court || 'N/A'}</li>
      </ul>
      <p>Please review the case details in the system.</p>
    </div>
  </div>`;
  return await sendEmail(judgeEmail, subject, html, `New case assigned: ${caseData.caseNumber}`);
};

// Hearing reminder notification
const sendHearingReminder = async (recipientEmail, recipientName, hearingData, caseData) => {
  const subject = `Hearing Reminder - ${caseData.caseNumber}`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e3c72; color: white; padding: 20px; text-align: center;">
      <h2>NBA LITIGMUS</h2>
    </div>
    <div style="padding: 20px;">
      <h3>Hearing Reminder</h3>
      <p>Hello ${recipientName},</p>
      <p>This is a reminder for an upcoming hearing:</p>
      <ul>
        <li><strong>Case:</strong> ${caseData.caseNumber}</li>
        <li><strong>Title:</strong> ${caseData.title || 'N/A'}</li>
        <li><strong>Date:</strong> ${new Date(hearingData.date).toLocaleDateString('en-NG')}</li>
        <li><strong>Time:</strong> ${hearingData.time || 'N/A'}</li>
        <li><strong>Court:</strong> ${caseData.court || 'N/A'}</li>
      </ul>
      <p>Please ensure all preparations are completed.</p>
    </div>
  </div>`;
  return await sendEmail(recipientEmail, subject, html, `Hearing reminder: ${caseData.caseNumber}`);
};

// Payment confirmation notification
const sendPaymentConfirmation = async (recipientEmail, recipientName, paymentData, caseData) => {
  const subject = `Payment Confirmation - ${paymentData.receiptNumber}`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e3c72; color: white; padding: 20px; text-align: center;">
      <h2>NBA LITIGMUS</h2>
    </div>
    <div style="padding: 20px;">
      <h3>Payment Confirmation</h3>
      <p>Hello ${recipientName},</p>
      <p>Your payment has been processed successfully:</p>
      <ul>
        <li><strong>Receipt Number:</strong> ${paymentData.receiptNumber}</li>
        <li><strong>Amount:</strong> N${paymentData.amount?.toLocaleString('en-NG') || 'N/A'}</li>
        <li><strong>Date:</strong> ${new Date(paymentData.date).toLocaleDateString('en-NG')}</li>
        <li><strong>Case:</strong> ${caseData?.caseNumber || 'N/A'}</li>
        <li><strong>Payment Type:</strong> ${paymentData.type || 'N/A'}</li>
      </ul>
      <p>Thank you for your payment.</p>
    </div>
  </div>`;
  return await sendEmail(recipientEmail, subject, html, `Payment confirmed: ${paymentData.receiptNumber}`);
};

// Case status update notification
const sendStatusUpdate = async (recipientEmail, recipientName, caseData, oldStatus, newStatus) => {
  const subject = `Case Status Update - ${caseData.caseNumber}`;
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #1e3c72; color: white; padding: 20px; text-align: center;">
      <h2>NBA LITIGMUS</h2>
    </div>
    <div style="padding: 20px;">
      <h3>Case Status Update</h3>
      <p>Hello ${recipientName},</p>
      <p>The status of case <strong>${caseData.caseNumber}</strong> has been updated:</p>
      <ul>
        <li><strong>Previous Status:</strong> ${oldStatus}</li>
        <li><strong>New Status:</strong> ${newStatus}</li>
        <li><strong>Title:</strong> ${caseData.title || 'N/A'}</li>
      </ul>
      <p>Please check the system for more details.</p>
    </div>
  </div>`;
  return await sendEmail(recipientEmail, subject, html, `Status update: ${caseData.caseNumber}`);
};

const sendAccountConfirmationEmail = async (userEmail, userName, confirmationToken) => {
  const confirmationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-account?token=${confirmationToken}`;
  const subject = 'Welcome to NBA LITIGMUS - Confirm Your Account';
  const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
    <div style="background: #1a472a; color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
      <h2 style="margin: 0;">NBA LITIGMUS</h2>
      <p style="margin: 8px 0 0 0;">Nigerian Bar Association Case Management System</p>
    </div>
    <div style="padding: 28px 24px; background: #f8fafc;">
      <h3 style="color: #1a472a; margin-top: 0;">Welcome, ${userName}!</h3>
      <p>Your NBA LITIGMUS account has been created successfully. To activate your account and access the system securely, please confirm your email address using the button below.</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${confirmationLink}" style="background: #1a472a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Confirm My Account</a>
      </div>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #475569;">${confirmationLink}</p>
      <p style="color: #64748b; font-size: 0.92rem;">This confirmation link will expire in 24 hours. If you did not create this account, you can safely ignore this email.</p>
    </div>
    <div style="padding: 16px 24px; background: #1a472a; color: rgba(255,255,255,0.82); text-align: center; border-radius: 0 0 12px 12px; font-size: 13px;">
      Justice. Technology. Excellence.
    </div>
  </div>`;
  return await sendEmail(userEmail, subject, html, `Welcome to NBA LITIGMUS. Confirm your account here: ${confirmationLink}`);
};

module.exports = {
  sendEmail,
  sendCaseAssignment,
  sendHearingReminder,
  sendPaymentConfirmation,
  sendStatusUpdate,
  sendAccountConfirmationEmail,
  sendWhatsAppMessage: whatsappService.sendWhatsAppMessage,
  sendJudgmentDelivered: whatsappService.sendJudgmentDelivered,
  sendHearingScheduled: whatsappService.sendHearingScheduled,
  sendCaseAdjourned: whatsappService.sendCaseAdjourned
};
