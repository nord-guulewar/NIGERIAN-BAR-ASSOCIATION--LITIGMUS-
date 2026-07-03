# 📱 WhatsApp Notification Integration Guide

## Overview
WhatsApp notifications have been integrated into NBA LITIGMUS to notify lawyers when cases are attended to (judgment delivered, hearings scheduled, cases adjourned).

## Features Implemented
- ✅ Judgment delivered notifications to lawyers
- ✅ Hearing scheduled notifications to lawyers
- ✅ Hearing reminder notifications (via secretary dashboard)
- ✅ Case adjournment notifications to lawyers

## Setup Instructions

### Step 1: Get Twilio Account
1. Go to https://www.twilio.com/
2. Create a free account
3. Go to WhatsApp Sandbox: https://www.twilio.com/console/sms/whatsapp/sandbox

### Step 2: Get Twilio Credentials
1. From Twilio Console, note your:
   - **ACCOUNT SID** (starts with `AC...`)
   - **AUTH TOKEN**

### Step 3: Configure `.env` File
Add to `/backend/.env`:
```env
# Twilio WhatsApp Configuration
TWILIO_ACCOUNT_SID=ACyour_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### Step 4: Join WhatsApp Sandbox (Testing)
1. Join the Twilio WhatsApp Sandbox with your phone number
2. Send the code from Twilio Console to the sandbox number
3. Test by delivering a judgment on a case

## How It Works

### Judgment Delivered
When a judge delivers judgment:
```
🏛️ NBA LITIGMUS Notification

Your case SHC/LA/IKJ/2024/001 has been Judged.

📋 Case Title: [Case Title]
👨‍⚖️ Judge: Justice Adebayo
📅 Date: 07/06/2026

Thank you.
```
Sent to: Both plaintiff and defendant lawyers

### Hearing Scheduled
When secretary schedules a hearing:
```
🏛️ NBA LITIGMUS

Hearing scheduled for case SHC/LA/IKJ/2024/001

📅 Date: 07/06/2026
📋 Title: [Case Title]

Please be prepared.
```
Sent to: Both plaintiff and defendant lawyers

### Case Adjourned
When judge adjourns a case:
```
🏛️ NBA LITIGMUS

Case SHC/LA/IKJ/2024/001 has been adjourned.

📅 New Date: 14/06/2026
📝 Reason: [Reason]
👨‍⚖️ By: Justice Adebayo

Please take note.
```
Sent to: Both plaintiff and defendant lawyers

## Phone Number Format
The system accepts Nigerian phone numbers in these formats:
- `08012345678` → Converted to `whatsapp:+2348012345678`
- `2348012345678` → Converted to `whatsapp:+2348012345678`
- `+2348012345678` → Converted to `whatsapp:+2348012345678`

## Production Deployment

### Using Twilio Production Number
1. Apply for a Twilio WhatsApp Business number
2. Update `TWILIO_WHATSAPP_NUMBER` in `.env`:
   ```env
   TWILIO_WHATSAPP_NUMBER=whatsapp:+234XXXXXXXXX
   ```

### Using Africa's Talking (Alternative)
For production in Nigeria, you may prefer Africa's Talking:

```javascript
// In whatsappService.js, replace Twilio with Africa's Talking
const africastalking = require('africastalking');

const sendWhatsAppMessage = async (to, message) => {
  const sms = africastalking.SMS;
  const result = await sms.send({
    to: [formatPhoneNumber(to)],
    message: message,
    from: process.env.AT_WHATSAPP_NUMBER
  });
  return result;
};
```

## Testing

### Demo Mode (No Twilio)
Without Twilio credentials, messages are logged to console:
```
📱 DEMO: Would send WhatsApp to +2348012345678: [message preview]...
```

### Test Judgment
1. Create a case with lawyer phone numbers
2. Assign to a judge
3. Login as judge and deliver judgment
4. Check console/logs for WhatsApp notification

## Environment Variables Required
- `TWILIO_ACCOUNT_SID` - Your Twilio account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio auth token
- `TWILIO_WHATSAPP_NUMBER` - The sender WhatsApp number (default: Twilio sandbox)

---

**Note:** WhatsApp notifications are sent asynchronously (fire-and-forget) to avoid blocking the main workflow.