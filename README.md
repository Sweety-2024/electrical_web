# Shivaay Traders Contact Form - Email Setup Guide

## Overview
The contact form sends enquiries to the supplier email (`a3527725@gmail.com`) using Gmail SMTP when SMTP credentials are configured. If SMTP is not configured yet, the backend still accepts the submission so the form does not fail during development.

---

## Prerequisites

1. **Node.js** (v14 or higher) — [Download](https://nodejs.org)
2. **Gmail Account** with 2-Step Verification enabled
3. **Gmail App Password** (not your regular Gmail password)

---

## Setup Instructions

### Step 1: Enable 2-Step Verification on Gmail

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left menu
3. Scroll to **How you sign in to Google**
4. Click **2-Step Verification** and follow the prompts
5. Once enabled, you can proceed to create an App Password

### Step 2: Create a Gmail App Password

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select **Mail** and **Windows Computer** (or your device type)
3. Click **Generate**
4. Google will show a 16-character password — **copy it exactly** (no spaces)
5. Keep this password safe; you'll use it in `.env`

### Step 3: Update `.env` File

Open `.env` in the project root and replace the placeholder values with real credentials:

```env
PORT=3000
SUPPLIER_EMAIL=a3527725@gmail.com

# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_16_digit_app_password
SMTP_FROM=your_gmail@gmail.com

# Optional CORS origins
ALLOWED_ORIGINS=http://localhost:3000
```

**Important:**
- `SMTP_USER` = your full Gmail address (e.g., `john@gmail.com`)
- `SMTP_PASS` = the 16-character app password (NOT your Gmail login password)
- `SMTP_FROM` = usually same as `SMTP_USER`
- `SUPPLIER_EMAIL` = the inbox receiving the enquiry (a3527725@gmail.com)

### Step 4: Install Dependencies

```powershell
npm install
```

Or if npm is blocked in PowerShell:

```powershell
npm.cmd install
```

### Step 5: Start the Backend Server

```powershell
node server.js
```

Expected output:
```
Server running on http://localhost:3000
```

### Step 6: Test the Contact Form

1. Open: `http://localhost:3000/contact.html`
2. Fill the form with valid details
3. Click **Send Inquiry**
4. **Expected result:** If SMTP is configured, email arrives in `a3527725@gmail.com` inbox within seconds. If not, the form still succeeds and shows a warning that no email was sent.

---

## File Locations

| File | Purpose |
|------|---------|
| `server.js` | Node.js backend API with Nodemailer SMTP |
| `contact.html` | Frontend contact form with validation |
| `.env` | Environment variables (Gmail credentials) |
| `package.json` | Node.js dependencies and scripts |

---

## Email Flow

### When User Submits Form:

1. **Frontend Validation** → Check name, phone, email, product, message
2. **Backend Validation** → Validate again server-side
3. **SMTP Verification** → Confirm Gmail SMTP connection
4. **Send Supplier Email** → Enquiry to `a3527725@gmail.com`
5. **Send Client Email** → Confirmation to user's email
6. **Return Response** → Success/error message to browser

### Server Console Logs:

```
[contact] Received inquiry { name: 'John', email: 'john@example.com', inquiry: 'Product Inquiry', product: 'LED' }
[contact] SMTP connection verified
[contact] Supplier email sent { messageId: '<...>', to: 'a3527725@gmail.com' }
[contact] Client confirmation email sent { messageId: '<...>', to: 'john@example.com' }
```

---

## Troubleshooting

### Warning: submission succeeds but no email is sent

- **Cause:** `.env` is missing or still contains placeholder values like `your_gmail_address@gmail.com`
- **Fix:** Create a real `.env` file with valid Gmail SMTP credentials if you want actual email delivery

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

- **Cause:** Wrong Gmail credentials or app password not created
- **Fix:** Verify 2-Step Verification is enabled and app password is correct

### Email not arriving in inbox

- **Check:** Spam/Promotions folder in Gmail
- **Check:** Gmail forwarding rules (Settings → Forwarding)
- **Check:** Server logs for send failure message

### Port 3000 already in use

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
node server.js
```

---

## Required npm Packages

```json
{
  "dependencies": {
    "express": "^4.22.1",
    "nodemailer": "^6.10.1",
    "cors": "^2.8.6",
    "helmet": "^7.2.0",
    "dotenv": "^16.6.1"
  }
}
```

---

## Frontend Success Message

When email sends successfully:
- ✅ **Success:** "Inquiry sent successfully. Email delivered to supplier inbox."
- ✅ **Warning:** "Supplier email was sent, but the confirmation email to the client failed."
- ❌ **Error:** "Unable to send inquiry right now. Please try again later."

---

## Production Deployment

Before deploying to production:

1. **Never commit `.env`** — it's already in `.gitignore`
2. **Use environment variables** on your hosting platform (Vercel, Render, Heroku, etc.)
3. **Enable HTTPS** to secure email credentials in transit
4. **Rate limit** contact form submissions to prevent spam
5. **Add reCAPTCHA** for additional spam protection

---

## Support

If the contact form still doesn't send:

1. **Check `.env`** → Verify all placeholders are replaced
2. **Check server console** → Look for error messages
3. **Check Gmail inbox spam folder** → Email might be marked as spam
4. **Restart server** → After editing `.env`, stop and restart `node server.js`

---

## Author

Shivaay Traders  
Website: http://localhost:3000  
Contact: +91 9871203212
