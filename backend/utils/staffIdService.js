const crypto = require('crypto');
const nodemailer = require('nodemailer');
const SibApiV3Sdk = require('@sendinblue/client');
const User = require('../models/User');
const { generateStaffId } = require('./staffIdGenerator');
const {
  canSelfGenerateStaffId,
  registerSelfStaffIdGeneration
} = require('./credentialPolicy');

const STAFF_ID_OTP_EXPIRY_MINUTES = 10;
const STAFF_ID_CODE_LENGTH = 8;

function generateStaffIdCode() {
  return crypto.randomBytes(STAFF_ID_CODE_LENGTH).toString('hex').toUpperCase();
}

async function sendStaffIdEmail(email, firstName, lastName, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background: #1e3c72; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">NBA LITIGMUS</h2>
        <p style="margin: 5px 0 0 0;">Case Management System</p>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Hello ${firstName} ${lastName},</p>
        <p>Your Staff ID generation code is:</p>
        <div style="background: #1e3c72; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 2rem; letter-spacing: 0.3rem;">${code}</h1>
        </div>
        <p>This code will expire in <strong>${STAFF_ID_OTP_EXPIRY_MINUTES} minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 0.9rem;">Use this code to generate your unique Staff ID. If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  const text = `Your NBA LITIGMUS Staff ID generation code is: ${code}. Valid for ${STAFF_ID_OTP_EXPIRY_MINUTES} minutes.`;

  try {
    if (process.env.BREVO_API_KEY) {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = {
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@nbalitigmus.ng',
        name: 'NBA LITIGMUS'
      };
      sendSmtpEmail.to = [{ email }];
      sendSmtpEmail.subject = 'NBA LITIGMUS - Staff ID Generation Code';
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.textContent = text;
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@nbalitigmus.ng',
        to: email,
        subject: 'NBA LITIGMUS - Staff ID Generation Code',
        html,
        text
      });
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('📧 STAFF ID GENERATION CODE (DEMO MODE)');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Code: ${code}`);
      console.log(`Valid: ${STAFF_ID_OTP_EXPIRY_MINUTES} minutes`);
      console.log('='.repeat(60) + '\n');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending staff ID code email:', error);
    return { success: false, message: error.message };
  }
}

async function requestStaffIdGeneration(user) {
  if (user.staffId) {
    return { success: false, message: 'User already has a Staff ID assigned.' };
  }

  const policyCheck = canSelfGenerateStaffId(user, new Date());
  if (!policyCheck.allowed) {
    await user.save();
    return {
      success: false,
      message: policyCheck.message,
      controls: policyCheck.controls
    };
  }

  const code = generateStaffIdCode();
  const expiresAt = new Date(Date.now() + STAFF_ID_OTP_EXPIRY_MINUTES * 60 * 1000);

  user.staffIdGenerationCode = code;
  user.staffIdGenerationCodeExpires = expiresAt;
  await user.save();

  const emailResult = await sendStaffIdEmail(user.email, user.firstName, user.lastName, code);

  return {
    success: emailResult.success,
    message: emailResult.success
      ? 'Staff ID generation code sent to your email.'
      : emailResult.message,
    demoCode: emailResult.success ? code : undefined,
    expiresAt,
    controls: policyCheck.controls
  };
}

async function verifyStaffIdCodeAndGenerate(userId, code, role, state, lga, title) {
  const user = await User.findById(userId)
    .select('+staffIdGenerationCode +staffIdGenerationCodeExpires');

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  if (user.staffId) {
    return { success: false, message: 'Staff ID already generated for this user.' };
  }

  const policyCheck = canSelfGenerateStaffId(user, new Date());
  if (!policyCheck.allowed) {
    await user.save();
    return {
      success: false,
      message: policyCheck.message,
      controls: policyCheck.controls
    };
  }

  if (!user.staffIdGenerationCode || !user.staffIdGenerationCodeExpires) {
    return { success: false, message: 'No Staff ID generation code found. Please request a new one.' };
  }

  if (new Date() > user.staffIdGenerationCodeExpires) {
    return { success: false, message: 'Staff ID generation code has expired. Please request a new one.' };
  }

  if (user.staffIdGenerationCode !== code.toUpperCase().trim()) {
    return { success: false, message: 'Invalid Staff ID generation code.' };
  }

  const staffId = await generateStaffId(role, state, lga, title);

  user.pendingStaffId = staffId;
  user.staffIdRequestStatus = 'pending_approval';
  user.staffIdRequestedAt = new Date();
  registerSelfStaffIdGeneration(user);
  user.staffIdGenerationCode = undefined;
  user.staffIdGenerationCodeExpires = undefined;
  await user.save();

  return {
    success: true,
    message: 'Staff ID generated and sent for admin approval. Write it down somewhere safe.',
    data: { staffId, approvalRequired: true },
    controls: policyCheck.controls
  };
}

async function verifyJudgeBarAndGenerateStaffId(userId, barRegistrationNumber, code, title, state, lga) {
  const user = await User.findById(userId)
    .select('+staffIdGenerationCode +staffIdGenerationCodeExpires');

  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  if (user.staffId) {
    return { success: false, message: 'Staff ID already generated for this user.' };
  }

  const policyCheck = canSelfGenerateStaffId(user, new Date());
  if (!policyCheck.allowed) {
    await user.save();
    return {
      success: false,
      message: policyCheck.message,
      controls: policyCheck.controls
    };
  }

  if (!user.staffIdGenerationCode || !user.staffIdGenerationCodeExpires) {
    return { success: false, message: 'No Staff ID generation code found. Please request a new one.' };
  }

  if (new Date() > user.staffIdGenerationCodeExpires) {
    return { success: false, message: 'Staff ID generation code has expired. Please request a new one.' };
  }

  if (user.staffIdGenerationCode !== code.toUpperCase().trim()) {
    return { success: false, message: 'Invalid Staff ID generation code.' };
  }

  const staffId = await generateStaffId('judge', state, lga, title);

  user.pendingStaffId = staffId;
  user.staffIdRequestStatus = 'pending_approval';
  user.staffIdRequestedAt = new Date();
  registerSelfStaffIdGeneration(user);
  user.barRegistrationNumber = barRegistrationNumber;
  user.staffIdGenerationCode = undefined;
  user.staffIdGenerationCodeExpires = undefined;
  await user.save();

  return {
    success: true,
    message: 'Staff ID generated and sent for admin approval. Write it down somewhere safe.',
    data: { staffId, approvalRequired: true },
    controls: policyCheck.controls
  };
}

module.exports = {
  generateStaffIdCode,
  requestStaffIdGeneration,
  verifyStaffIdCodeAndGenerate,
  verifyJudgeBarAndGenerateStaffId
};
