# Sending Real Emails from CampusLink

By default, "forgot password" and "verify email" print their links to the **server console** instead of actually emailing anyone. This is intentional — it means the app is fully testable without any email setup. This guide covers turning on real sending.

## Why you're seeing console logs instead of emails

`sendEmail()` checks whether `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are **all** set in your `.env`. If any of them are missing, it falls back to printing the email instead of sending it — silently, on purpose, so a missing `.env` value never breaks the login flow for someone testing locally.

## Option A: Gmail (easiest for testing, free)

Gmail won't accept your normal account password for this — you need an **App Password**, which is a 16-character code generated specifically for apps like this one.

1. Go to your Google Account → **Security** → make sure **2-Step Verification** is turned on (App Passwords won't appear in the menu until it is).
2. Still under Security, search for **"App passwords"** (or go directly to https://myaccount.google.com/apppasswords).
3. Create one — name it anything, e.g. "CampusLink". Google gives you a 16-character password like `abcd efgh ijkl mnop`.
4. Add these to `backend/server/.env` (remove the spaces from the app password):

   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=youraddress@gmail.com
   SMTP_PASS=abcdefghijklmnop
   SMTP_FROM="CampusLink <youraddress@gmail.com>"
   ```

5. Test it before relying on the full app flow:

   ```bash
   cd backend/server
   npm run test-email youraddress@gmail.com
   ```

   You should see `✅ Email sent successfully` and get a real email within a few seconds. If it fails, the script prints the most common causes (wrong port, spaces left in the app password, 2FA not actually enabled).

6. Restart `npm run dev` so the server picks up the new `.env` values, then try Forgot Password from the app for real.

**Gmail's limits:** ~500 emails/day on a free account — fine for development and small-scale use, not meant for production email volume.

## Option B: A transactional email service (recommended for production)

Gmail SMTP is fine for testing but not ideal in production (deliverability, rate limits, "sent via Gmail" branding). Services built for this — [Resend](https://resend.com), [SendGrid](https://sendgrid.com), [Mailgun](https://mailgun.com) — all give you SMTP credentials that drop into the exact same `.env` fields:

```env
SMTP_HOST=smtp.resend.com        # or whatever your provider gives you
SMTP_PORT=587
SMTP_USER=resend                  # varies by provider
SMTP_PASS=your_api_key_here
SMTP_FROM="CampusLink <no-reply@yourdomain.com>"
```

No code changes needed — the app already talks generic SMTP via `nodemailer`, so any provider that gives you host/port/user/pass works.

## On Render (deployment)

Set the same `SMTP_*` variables as environment variables in the Render dashboard for your backend service (see `DEPLOYMENT.md`). Nothing else changes.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Still seeing console logs, not real emails | One of `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` is empty or has a typo — `npm run test-email` will show you exactly what it read |
| `Invalid login` error | Using your real Gmail password instead of an App Password, or 2-Step Verification isn't actually on |
| `Connection timeout` | Wrong `SMTP_HOST`/`SMTP_PORT`, or your network/firewall is blocking outbound SMTP |
| Email sends but never arrives | Check spam folder first; if using Gmail SMTP, the "From" address must match the authenticated account |
