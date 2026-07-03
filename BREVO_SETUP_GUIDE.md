# 📧 Brevo Email Setup Guide

## ✅ Quick Setup (5 Minutes)

### Step 1: Create Free Brevo Account

1. Go to **https://www.brevo.com/** (formerly Sendinblue)
2. Click **"Sign up free"**
3. Fill in your details (no credit card required)
4. Verify your email address

### Step 2: Get Your API Key

1. Log into your Brevo dashboard
2. Click your name in the top-right corner
3. Go to **"SMTP & API"** → **"API Keys"**
4. Click **"Generate a new API key"**
5. Give it a name like "NBA LITIGMUS"
6. Copy the API key (starts with `xkeysib-...`)

### Step 3: Add Sender Email

1. In Brevo dashboard, go to **"Senders"** → **"Add a sender"**
2. Add your email address (e.g., `your_email@gmail.com`)
3. Verify the email by clicking the link Brevo sends you
4. This email will be used as the "From" address

### Step 4: Configure Your `.env` File

Add these two lines to `/backend/.env`:

```env
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=your_verified_email@gmail.com
```

**Example:**
```env
BREVO_API_KEY=xkeysib-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
BREVO_SENDER_EMAIL=olaleyelekanjoseph@gmail.com
```

### Step 5: Restart Your Backend

```bash
cd backend
npm start
```

---

## 🎯 How It Works Now

1. **User logs in** → System sends verification code to their email
2. **Brevo API** sends the email (300 free emails/day)
3. **User receives code** in their inbox
4. **User enters code** → Access granted

---

## 📊 Free Tier Limits

- ✅ **300 emails per day** (plenty for verification codes)
- ✅ **No credit card required**
- ✅ **No expiration**
- ✅ **Reliable delivery**

---

## 🧪 Testing

### Test 1: List All Users
```bash
cd backend
node scripts/updateUserEmail.js list
```

### Test 2: Update a User's Email to Yours
```bash
node scripts/updateUserEmail.js old@email.com your_email@gmail.com
```

### Test 3: Try Logging In
1. Go to the login page
2. Enter your credentials
3. Check your email inbox for the verification code
4. Enter the code

---

## 🔍 Troubleshooting

### ❌ "No email received"
- Check your spam/junk folder
- Verify your sender email is verified in Brevo dashboard
- Check backend console for error messages
- Make sure `BREVO_API_KEY` is correct in `.env`

### ❌ "API key invalid"
- Double-check the API key in your `.env` file
- Make sure there are no extra spaces
- Regenerate the API key in Brevo dashboard if needed

### ❌ "Sender email not verified"
- Go to Brevo dashboard → Senders
- Click the verification link sent to your email
- Update `BREVO_SENDER_EMAIL` in `.env` to match

### ✅ Still seeing console codes?
- This means Brevo is not configured yet
- Check that `.env` has `BREVO_API_KEY` set
- Restart your backend server after adding the key

---

## 📝 Environment Variables Summary

Add these to `/backend/.env`:

```env
# Brevo Email Configuration
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_EMAIL=your_verified_email@gmail.com
```

---

## 🚀 Production Tips

1. **Monitor usage**: Check Brevo dashboard for email statistics
2. **Upgrade if needed**: If you exceed 300/day, upgrade to paid plan
3. **Keep API key secret**: Never commit `.env` to git
4. **Use professional sender**: Consider using a domain email for production

---

## 📞 Support

- **Brevo Support**: https://help.brevo.com/
- **Brevo Status**: https://status.brevo.com/
- **API Docs**: https://developers.brevo.com/

---

## ✨ Benefits Over Gmail

| Feature | Gmail SMTP | Brevo |
|---------|-----------|-------|
| Setup Complexity | High (App Passwords) | Easy (API Key) |
| Daily Limit | ~500 emails | 300 emails (free) |
| Reliability | Medium | High |
| Deliverability | Medium | High |
| Analytics | No | Yes |
| No Credit Card | ❌ | ✅ |

---

**You're all set! 🎉**

Once configured, users will receive verification codes at their registered email addresses automatically.
