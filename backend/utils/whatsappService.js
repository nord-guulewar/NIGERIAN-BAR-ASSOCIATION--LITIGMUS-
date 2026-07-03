const twilio = require('twilio');

const getTwilioClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return null;
  }
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('234')) {
    return `whatsapp:+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `whatsapp:+234${cleaned.substring(1)}`;
  } else if (cleaned.startsWith('+234')) {
    return `whatsapp:${cleaned.substring(1)}`;
  }
  return null;
};

const sendWhatsAppMessage = async (to, message) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      console.log(`📱 DEMO: Would send WhatsApp to ${to}: ${message.substring(0, 50)}...`);
      return { success: true, demo: true };
    }

    const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
    const formattedTo = formatPhoneNumber(to);

    if (!formattedTo) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const result = await client.messages.create({
      body: message,
      from: from,
      to: formattedTo
    });

    console.log(`✅ WhatsApp sent to ${to}: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error('❌ WhatsApp error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendCaseAttendanceNotification = async (phoneNumber, caseData, judgeName, attendanceType) => {
  const message = `🏛️ *NBA LITIGMUS Notification*\n\nYour case ${caseData.caseNumber} has been *${attendanceType}*.\n\n📋 *Case Title:* ${caseData.title || 'N/A'}\n👨‍⚖️ *Judge:* ${judgeName}\n📅 *Date:* ${new Date().toLocaleDateString('en-NG')}\n\nThank you.`;
  return await sendWhatsAppMessage(phoneNumber, message);
};

const sendJudgmentDelivered = async (phoneNumber, caseData, judgeName) => {
  return await sendCaseAttendanceNotification(phoneNumber, caseData, judgeName, 'Judged');
};

const sendHearingScheduled = async (phoneNumber, caseData, hearingDate) => {
  const message = `🏛️ *NBA LITIGMUS*\n\nHearing scheduled for case ${caseData.caseNumber}\n\n📅 *Date:* ${new Date(hearingDate).toLocaleDateString('en-NG')}\n📋 *Title:* ${caseData.title || 'N/A'}\n\nPlease be prepared.`;
  return await sendWhatsAppMessage(phoneNumber, message);
};

const sendCaseAdjourned = async (phoneNumber, caseData, judgeName, nextDate, reason) => {
  const message = `🏛️ *NBA LITIGMUS*\n\nCase ${caseData.caseNumber} has been adjourned.\n\n📅 *New Date:* ${new Date(nextDate).toLocaleDateString('en-NG')}\n📝 *Reason:* ${reason}\n👨‍⚖️ *By:* ${judgeName}\n\nPlease take note.`;
  return await sendWhatsAppMessage(phoneNumber, message);
};

module.exports = {
  sendWhatsAppMessage,
  sendCaseAttendanceNotification,
  sendJudgmentDelivered,
  sendHearingScheduled,
  sendCaseAdjourned
};