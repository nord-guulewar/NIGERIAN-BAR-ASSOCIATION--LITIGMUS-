const crypto = require('crypto');
const nodemailer = require('nodemailer');
const SibApiV3Sdk = require('@sendinblue/client');
const https = require('https');
const http = require('http');

const BAR_API_KEY = process.env.BAR_API_KEY || '';
const BAR_API_BASE_URL = process.env.BAR_API_BASE_URL || 'https://api.nigerianbar.org/v1';
const BAR_PROVIDER = process.env.BAR_VERIFICATION_PROVIDER || 'demo';

const STAFF_ID_CODE_EXPIRY_MINUTES = 10;

function requestJson(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      timeout: Number(process.env.BAR_API_TIMEOUT_MS || 15000)
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ statusCode: 504, body: JSON.stringify({ message: 'Bar registration verification service timed out.' }) });
    });

    req.on('error', (err) => reject(err));

    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function verifyWithBarApi(barRegistrationNumber, context = {}) {
  const url = `${BAR_API_BASE_URL.replace(/\/$/, '')}/members/verify`;
  const response = await requestJson('POST', url, {
    headers: { Authorization: `Bearer ${BAR_API_KEY}` },
    body: {
      barRegistrationNumber,
      firstName: context.firstName,
      lastName: context.lastName,
      phoneNumber: context.phoneNumber
    }
  });

  let parsed = {};
  try {
    parsed = response.body ? JSON.parse(response.body) : {};
  } catch {
    return { success: false, message: 'Invalid response from Bar registration verification service.' };
  }

  if (response.statusCode >= 200 && response.statusCode < 300 && parsed.success !== false) {
    return {
      success: true,
      data: {
        barRegistrationNumber,
        firstName: parsed.firstName || parsed.firstname || '',
        lastName: parsed.lastName || parsed.lastname || '',
        callToBarYear: parsed.callToBarYear || parsed.yearOfCall || '',
        supremeCourtNumber: parsed.supremeCourtNumber || parsed.scn || '',
        status: parsed.status || 'active',
        verified: true,
        verificationId: parsed.verificationId || `BAR-${Date.now()}-${barRegistrationNumber.slice(-4)}`,
        provider: 'bar_api'
      }
    };
  }

  return {
    success: false,
    message: parsed.message || parsed.error || 'Bar registration verification failed.'
  };
}

function demoVerifyBar(barRegistrationNumber) {
  return {
    success: true,
    data: {
      barRegistrationNumber,
      firstName: '',
      lastName: '',
      callToBarYear: '',
      supremeCourtNumber: '',
      status: 'active',
      verified: true,
      verificationId: `DEMO-${Date.now()}-${barRegistrationNumber.slice(-4)}`,
      provider: 'demo',
      message: 'Bar registration verification simulated. Configure BAR_API_KEY for live verification.'
    }
  };
}

async function verifyBarRegistration(barRegistrationNumber, context = {}) {
  if (!barRegistrationNumber) {
    return { success: false, message: 'Bar registration number is required.' };
  }

  const cleaned = barRegistrationNumber.trim().toUpperCase();

  if (!/^SC\/\d+\/\d{4}$/.test(cleaned)) {
    return {
      success: false,
      message: 'Invalid bar registration number format. Expected: SC/NUMBER/YEAR (e.g., SC/1234/2015).'
    };
  }

  if (!BAR_API_KEY) {
    return demoVerifyBar(cleaned);
  }

  return verifyWithBarApi(cleaned, context);
}

async function checkBarRegistrationExists(barRegistrationNumber, userModel) {
  const UserModel = userModel || require('../models/User');
  const existing = await UserModel.findOne({ barRegistrationNumber });
  if (existing) {
    return {
      exists: true,
      message: 'This bar registration number is already registered to another account.'
    };
  }
  return { exists: false };
}

function generateStaffIdCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

async function sendStaffIdCodeEmail(email, firstName, code) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <div style="background: #1e3c72; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="margin: 0;">NBA LITIGMUS</h2>
        <p style="margin: 5px 0 0 0;">Case Management System</p>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <p>Hello ${firstName},</p>
        <p>Your bar registration has been verified. Use the code below to generate your Staff ID:</p>
        <div style="background: #1e3c72; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <h1 style="margin: 0; font-size: 2rem; letter-spacing: 0.3rem;">${code}</h1>
        </div>
        <p>This code will expire in <strong>${STAFF_ID_CODE_EXPIRY_MINUTES} minutes</strong>.</p>
        <p style="color: #6b7280; font-size: 0.9rem;">If you did not request this code, please ignore this email.</p>
      </div>
    </div>
  `;

  const text = `Your NBA LITIGMUS Staff ID generation code is: ${code}. Valid for ${STAFF_ID_CODE_EXPIRY_MINUTES} minutes.`;

  try {
    if (process.env.BREVO_API_KEY) {
      try {
        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.sender = { email: process.env.BREVO_SENDER_EMAIL || 'noreply@nbalitigmus.ng', name: 'NBA LITIGMUS' };
        sendSmtpEmail.to = [{ email }];
        sendSmtpEmail.subject = 'NBA LITIGMUS - Staff ID Generation Code';
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.textContent = text;
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Staff ID code email sent to ${email}`);
        return { success: true, code };
      } catch (brevoError) {
        console.error('Brevo API error, falling back to demo:', brevoError.message);
        console.log('\n' + '='.repeat(60));
        console.log('📧 STAFF ID GENERATION CODE (DEMO MODE - Brevo failed)');
        console.log('='.repeat(60));
        console.log(`To: ${email}`);
        console.log(`Code: ${code}`);
        console.log(`Valid: ${STAFF_ID_CODE_EXPIRY_MINUTES} minutes`);
        console.log('='.repeat(60) + '\n');
        return { success: true, code, demo: true };
      }
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
        html, text
      });
      return { success: true, code };
    } else {
      console.log('\n' + '='.repeat(60));
      console.log('📧 STAFF ID GENERATION CODE (DEMO MODE)');
      console.log('='.repeat(60));
      console.log(`To: ${email}`);
      console.log(`Code: ${code}`);
      console.log(`Valid: ${STAFF_ID_CODE_EXPIRY_MINUTES} minutes`);
      console.log('='.repeat(60) + '\n');
    }
    return { success: true, code };
} catch (error) {
    console.error('Error sending staff ID code email:', error.message);
    console.error('Error details:', error.response?.body || error.stack);
    return { success: false, message: error.message || 'Unknown email error' };
  }
}

module.exports = {
  verifyBarRegistration,
  checkBarRegistrationExists,
  generateStaffIdCode,
  sendStaffIdCodeEmail,
  STAFF_ID_CODE_EXPIRY_MINUTES
};
