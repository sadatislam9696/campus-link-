// Run with: node scripts/testEmail.js your@email.com
// Sends one real test email using whatever SMTP_* values are in your
// .env, so you can verify your credentials work BEFORE relying on them
// through the actual forgot-password / verify-email flows.

require("dotenv").config();
const { sendEmail, isEmailConfigured } = require("../src/utils/sendEmail");

const run = async () => {
  const to = process.argv[2];

  if (!to) {
    console.error("Usage: node scripts/testEmail.js <your-email>");
    process.exit(1);
  }

  console.log("SMTP_HOST:", process.env.SMTP_HOST || "(not set)");
  console.log("SMTP_PORT:", process.env.SMTP_PORT || "(not set)");
  console.log("SMTP_USER:", process.env.SMTP_USER || "(not set)");
  console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***set***" : "(not set)");
  console.log("");

  if (!isEmailConfigured()) {
    console.log(
      "⚠️  SMTP isn't fully configured (SMTP_HOST, SMTP_USER, and SMTP_PASS all need to be set)."
    );
    console.log(
      "   This test will just print the email to the console instead of actually sending it."
    );
    console.log("   See EMAIL_SETUP.md for how to set these up with Gmail.\n");
  }

  try {
    const result = await sendEmail({
      to,
      subject: "CampusLink SMTP test",
      text: "If you're reading this in your inbox, your SMTP configuration works! ✅",
      html: "<p>If you're reading this in your inbox, your SMTP configuration works! ✅</p>",
    });

    if (result.devMode) {
      console.log("ℹ️  Ran in dev/console mode (see above) - no real email was sent.");
    } else {
      console.log(`✅ Email sent successfully to ${to}. Check your inbox (and spam folder).`);
      console.log("Message ID:", result.messageId);
    }
  } catch (error) {
    console.error("❌ Sending failed:", error.message);
    console.error(
      "\nCommon causes: wrong SMTP_PORT/host, an app password with spaces still in it, or 2FA not enabled on the Gmail account (required for app passwords)."
    );
    process.exit(1);
  }
};

run();
