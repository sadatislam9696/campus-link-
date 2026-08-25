const nodemailer = require("nodemailer");

// If SMTP credentials aren't set, we fall back to logging the email to
// the console instead of failing outright. This keeps "forgot password"
// fully testable in local/dev environments that haven't wired up a real
// mail provider yet (e.g. SendGrid, Mailgun, Gmail app password).
const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailConfigured()) {
    console.log("\n📧 [DEV EMAIL - SMTP not configured, logging instead]");
    console.log("   (Want real emails? See EMAIL_SETUP.md, or run: npm run test-email)");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log("📧 [END DEV EMAIL]\n");
    return { devMode: true };
  }

  const info = await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"CampusLink" <no-reply@campuslink.app>`,
    to,
    subject,
    text,
    html,
  });

  return info;
};

module.exports = { sendEmail, isEmailConfigured };
