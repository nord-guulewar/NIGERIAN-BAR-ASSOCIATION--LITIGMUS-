/**
 * Email Service
 * Centralized email sending utility using Brevo (SendInBlue)
 */

const SibApiV3Sdk = require('@sendinblue/client');

/**
 * Initialize Brevo API
 */
const getBrevo = () => {
  if (!process.env.BREVO_API_KEY) {
    console.log('ℹ️  BREVO_API_KEY not configured - emails will be logged only');
    return null;
  }
  const api = new SibApiV3Sdk.TransactionalEmailsApi();
  api.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  return api;
};

/**
 * Send generic email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - HTML email content
 * @param {string} text - Plain text email content (fallback)
 * @returns {Promise<{success: boolean, demo?: boolean, error?: string}>}
 */
const sendEmail = async (to, subject, html, text) => {
  try {
    const api = getBrevo();
    
    if (api) {
      const email = new SibApiV3Sdk.SendSmtpEmail();
      email.sender = { 
        email: process.env.BREVO_SENDER_EMAIL || 'noreply@nbalitigmus.ng', 
        name: 'NBA LITIGMUS' 
      };
      email.to = [{ email: to }];
      email.subject = subject;
      email.htmlContent = html;
      email.textContent = text || subject;
      
      await api.sendTransacEmail(email);
      console.log(`✅ Email sent to ${to}: ${subject}`);
      return { success: true };
    }
    
    // Demo mode: log email instead of sending
    console.log(`📧 DEMO MODE - Email would be sent to ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   HTML preview: ${html.substring(0, 100)}...`);
    return { success: true, demo: true };
    
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    if (error.response?.body) {
      console.error('   Details:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 * @param {string} recipientEmail - User's email address
 * @param {string} recipientName - User's first name
 * @param {string} resetLink - Full password reset link
 * @returns {Promise<{success: boolean, demo?: boolean, error?: string}>}
 */
const sendPasswordResetEmail = async (recipientEmail, recipientName, resetLink) => {
  const subject = 'Password Reset Request - NBA LITIGMUS';
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1a472a 0%, #0f2818 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 28px;">🔐 Password Reset</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">NBA LITIGMUS System</p>
      </div>
      
      <!-- Body -->
      <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #333;">Hello ${recipientName},</p>
        
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #555; line-height: 1.6;">
          We received a request to reset the password for your NBA LITIGMUS account. 
          If you didn't make this request, you can safely ignore this email.
        </p>
        
        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%); color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; transition: opacity 0.3s;">
            Reset Password
          </a>
        </div>
        
        <!-- Link as text (in case button doesn't work) -->
        <p style="margin: 20px 0; font-size: 12px; color: #888;">
          Or copy and paste this link in your browser:<br/>
          <code style="background: #e8e8e8; padding: 8px 12px; border-radius: 4px; display: inline-block; word-break: break-all; font-size: 11px;">
            ${resetLink}
          </code>
        </p>
        
        <!-- Info -->
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #856404;">
          <strong>⏱️ Important:</strong> This password reset link expires in <strong>1 hour</strong>. 
          If you don't reset your password within this time, you'll need to request a new link.
        </div>
        
        <!-- Security note -->
        <p style="margin: 20px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 16px;">
          <strong>Security Tip:</strong> Never share this link with anyone. NBA LITIGMUS staff will never ask for your password or this link.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 16px; font-size: 12px; color: #999; background: #f0f0f0;">
        <p style="margin: 0;">© 2026 Nigerian Bar Association. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">This email was sent from NBA LITIGMUS Case Management System</p>
      </div>
    </div>
  `;
  
  const text = `
Password Reset Request

Hello ${recipientName},

We received a request to reset the password for your NBA LITIGMUS account.

Click the link below to reset your password:
${resetLink}

This link expires in 1 hour.

If you didn't request this, please ignore this email.

--- 
Nigerian Bar Association
NBA LITIGMUS Case Management System
  `;
  
  return await sendEmail(recipientEmail, subject, html, text);
};

/**
 * Send password change confirmation email
 * @param {string} recipientEmail - User's email address
 * @param {string} recipientName - User's first name
 * @returns {Promise<{success: boolean, demo?: boolean, error?: string}>}
 */
const sendPasswordChangeConfirmation = async (recipientEmail, recipientName) => {
  const subject = 'Password Changed Successfully - NBA LITIGMUS';
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 28px;">✅ Password Changed</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">NBA LITIGMUS System</p>
      </div>
      
      <!-- Body -->
      <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #333;">Hello ${recipientName},</p>
        
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #555; line-height: 1.6;">
          Your password has been successfully changed. You can now log in to your NBA LITIGMUS account with your new password.
        </p>
        
        <!-- Success info -->
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #155724;">
          <strong>✓ Password Updated:</strong> Your account is now secured with your new password.
        </div>
        
        <!-- Security actions -->
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #555; font-weight: bold;">
          Next Steps:
        </p>
        <ul style="margin: 8px 0 20px 0; padding-left: 20px; font-size: 13px; color: #555;">
          <li>Log in with your new password</li>
          <li>If you didn't make this change, contact support immediately</li>
          <li>Keep your password secure and never share it</li>
        </ul>
        
        <!-- Support -->
        <p style="margin: 20px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 16px;">
          <strong>Need help?</strong> If you didn't request this password change or have any concerns, please contact our support team immediately.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 16px; font-size: 12px; color: #999; background: #f0f0f0;">
        <p style="margin: 0;">© 2026 Nigerian Bar Association. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">This email was sent from NBA LITIGMUS Case Management System</p>
      </div>
    </div>
  `;
  
  const text = `
Password Changed Successfully

Hello ${recipientName},

Your password has been successfully changed. You can now log in with your new password.

If you didn't request this change, please contact support immediately.

--- 
Nigerian Bar Association
NBA LITIGMUS Case Management System
  `;
  
  return await sendEmail(recipientEmail, subject, html, text);
};

/**
 * Send account locked notification
 * @param {string} recipientEmail - User's email address
 * @param {string} recipientName - User's first name
 * @param {Date} unlocksAt - When the account will be unlocked
 * @returns {Promise<{success: boolean, demo?: boolean, error?: string}>}
 */
const sendAccountLockedNotification = async (recipientEmail, recipientName, unlocksAt) => {
  const subject = 'Account Locked - NBA LITIGMUS';
  const unlockTime = new Date(unlocksAt).toLocaleTimeString('en-NG');
  
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 28px;">🔒 Account Locked</h2>
        <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">NBA LITIGMUS System</p>
      </div>
      
      <!-- Body -->
      <div style="background: #f8f9fa; padding: 30px 20px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #333;">Hello ${recipientName},</p>
        
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #555; line-height: 1.6;">
          Your NBA LITIGMUS account has been temporarily locked due to multiple failed login attempts.
        </p>
        
        <!-- Warning -->
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 20px 0; font-size: 13px; color: #856404;">
          <strong>⏱️ Account Unlocks At:</strong> ${unlockTime} (15 minutes from lock time)
        </div>
        
        <!-- Options -->
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #555; font-weight: bold;">
          What You Can Do:
        </p>
        <ul style="margin: 8px 0 20px 0; padding-left: 20px; font-size: 13px; color: #555;">
          <li>Wait 15 minutes and try logging in again</li>
          <li>Reset your password if you forgot it</li>
          <li>Contact support if you believe this is in error</li>
        </ul>
        
        <!-- Security note -->
        <p style="margin: 20px 0 0 0; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 16px;">
          <strong>Security Note:</strong> This lock is a security feature to protect your account. 
          If you didn't attempt to log in, please reset your password immediately.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; padding: 16px; font-size: 12px; color: #999; background: #f0f0f0;">
        <p style="margin: 0;">© 2026 Nigerian Bar Association. All rights reserved.</p>
        <p style="margin: 4px 0 0 0;">This email was sent from NBA LITIGMUS Case Management System</p>
      </div>
    </div>
  `;
  
  const text = `
Account Locked

Hello ${recipientName},

Your NBA LITIGMUS account has been locked due to multiple failed login attempts.

Account will unlock at: ${unlockTime}

Please wait 15 minutes before trying again, or reset your password.

--- 
Nigerian Bar Association
NBA LITIGMUS Case Management System
  `;
  
  return await sendEmail(recipientEmail, subject, html, text);
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmation,
  sendAccountLockedNotification
};
