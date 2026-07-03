const nodemailer = require('nodemailer');
const SibApiV3Sdk = require('@sendinblue/client');
const User = require('../models/User');

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendEmail = async (email, code) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background: #1e3c72; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">NBA LITIGMUS</h2>
        <p style="margin: 5px 0 0 0;">Case Management System</p>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Hello,</p>
        <p>Your verification code for login is:</p>
        <div style="background: #1e3c72; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 2.5rem; letter-spacing: 0.5rem;">${code}</h1>
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 0.9rem;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  try {
    if (process.env.BREVO_API_KEY) {
      const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
      apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      sendSmtpEmail.sender = { 
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@nbalitigmus.ng',
        name: 'NBA LITIGMUS'
      };
      sendSmtpEmail.to = [{ email: email }];
      sendSmtpEmail.subject = 'NBA LITIGMUS - Login Verification Code';
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.textContent = `Your NBA LITIGMUS verification code is: ${code}. Valid for 10 minutes.`;

      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(`✅ Verification code sent to ${email} via Brevo`);
      
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
        subject: 'NBA LITIGMUS - Login Verification Code',
        html: html,
        text: `Your NBA LITIGMUS verification code is: ${code}. Valid for 10 minutes.`
      });
      console.log(`✅ Verification code sent to ${email} via SMTP`);
      
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('📧 EMAIL VERIFICATION CODE (DEMO MODE)');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Code: ${code}`);
      console.log(`Valid: 10 minutes`);
      console.log('='.repeat(60));
      console.log('⚠️  Configure BREVO_API_KEY in .env to send real emails');
      console.log('='.repeat(60) + '\n');
    }

    return { success: true, message: 'Email sent successfully' };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, message: error.message };
  }
};

const assessRisk = (user, ip, userAgent) => {
  const emailDomain = (user.email || '').split('@')[1]?.toLowerCase() || '';
  const wellKnownDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'nbalitigmus.ng', 'court.gov.ng'];
  const disposableDomains = ['mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'yopmail.com'];

  const signals = {
    newEmailDomain: !wellKnownDomains.includes(emailDomain),
    disposableEmail: disposableDomains.includes(emailDomain),
    mxLookupFailed: disposableDomains.includes(emailDomain) || /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(emailDomain),
    typosquattingRisk: /(googole|yahooo|outlok|hotmal|nbal[o0]tgmus|c[o0]urt|gouv)/i.test(emailDomain),
    recentPasswordChange: user.updatedAt ? (Date.now() - user.updatedAt.getTime()) < 86400000 : false,
    deviceChange: !!(user.lastUserAgent && userAgent && user.lastUserAgent !== userAgent),
    ipGeoMismatch: !/^::1$|^127\./.test(ip || '') && !(ip || '').startsWith('192.168.')
  };

  let score = 0;
  if (signals.disposableEmail) score += 35;
  if (signals.typosquattingRisk) score += 25;
  if (signals.mxLookupFailed) score += 15;
  if (signals.newEmailDomain) score += 10;
  if (signals.recentPasswordChange) score += 10;
  if (signals.deviceChange) score += 10;
  if (signals.ipGeoMismatch) score += 5;

  return { score: Math.min(score, 100), signals };
};

const sendVerificationCode = async (userId, ip, userAgent) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.email) {
      return { success: false, message: 'No email associated with this account' };
    }

    const risk = assessRisk(user, ip, userAgent);

    if (risk.score >= 80) {
      user.emailVerificationRisk = { score: risk.score, signals: risk.signals, evaluatedAt: new Date() };
      user.lastLoginIp = ip;
      user.lastUserAgent = userAgent;
      await user.save();

      return {
        success: false,
        message: 'Verification blocked due to high risk score. Contact administrator.',
        risk
      };
    }

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = code;
    user.verificationCodeExpires = expiresAt;
    user.emailVerificationRisk = { score: risk.score, signals: risk.signals, evaluatedAt: new Date() };
    user.lastLoginIp = ip;
    user.lastUserAgent = userAgent;
    await user.save();

    const result = await sendEmail(user.email, code);

    return {
      success: result.success,
      message: result.success ? 'Verification code sent to email' : result.message,
      method: result.success ? 'email' : undefined,
      demoCode: result.success ? code : undefined,
      expiresAt,
      risk
    };
  } catch (error) {
    console.error('Error sending verification code:', error);
    return { success: false, message: error.message };
  }
};

const verifyCode = async (userId, code) => {
  try {
    const user = await User.findById(userId).select('+verificationCode +verificationCodeExpires');
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.verificationCode || !user.verificationCodeExpires) {
      return { success: false, message: 'No verification code found' };
    }

    if (new Date() > user.verificationCodeExpires) {
      return { success: false, message: 'Verification code has expired' };
    }

    if (user.verificationCode !== code) {
      return { success: false, message: 'Invalid verification code' };
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return { success: true, message: 'Verification successful' };
  } catch (error) {
    console.error('Error verifying code:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode,
  generateVerificationCode
};
