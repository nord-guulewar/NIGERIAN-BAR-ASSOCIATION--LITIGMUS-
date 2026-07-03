# Email Configuration Guide

## 🎯 Quick Setup

### Step 1: Configure SMTP in `.env` file

Add these lines to your `/backend/.env` file:

```env
# SMTP Configuration for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM=your_email@gmail.com
```

### Step 2: Get Gmail App Password

1. **Enable 2-Factor Authentication** on your Google account:
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (remove spaces)
   - Use this as `SMTP_PASS` in your `.env` file

### Step 3: Update User Email in Database

Run the helper script to see all users:
```bash
cd backend
node scripts/updateUserEmail.js list
```

Update a user's email:
```bash
node scripts/updateUserEmail.js old@email.com your_new@email.com
```

---

## 📧 How It Works

- Verification codes are sent to the **email stored in each user's account**
- When you login, the system sends a code to your user email
- The code expires in 10 minutes (email) or 5 minutes (console demo)

---

## 🔧 Alternative Email Providers

### For Outlook/Hotmail:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@outlook.com
SMTP_PASS=your_password
```

### For Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@yahoo.com
SMTP_PASS=your_app_password
```

### For Custom SMTP:
```env
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

---

## ✅ Testing

After configuration, restart your backend server:
```bash
cd backend
npm start
```

Try logging in - you should receive the verification code via email!

---

## 🐛 Troubleshooting

**No email received?**
- Check spam/junk folder
- Verify SMTP credentials are correct
- Check backend console for error messages
- Ensure 2FA and App Password are set up correctly

**Still using console codes?**
- If SMTP is not configured, codes print to the terminal
- Look for the `📧 EMAIL VERIFICATION CODE` section in your backend logs
