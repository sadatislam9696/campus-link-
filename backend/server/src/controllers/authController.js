const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

// =========================
// Register User
// =========================

const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password } = req.body || {};

    // Validation
    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Check existing email
    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Check existing username
    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const { rawToken, hashedToken } = require("../utils/tokenHelper").generateSecureToken();

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    const { sendEmail } = require("../utils/sendEmail");
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your CampusLink email",
        text: `Hi ${user.firstName}, welcome to CampusLink! Verify your email using this link: ${verifyUrl}`,
        html: `<p>Hi ${user.firstName}, welcome to CampusLink!</p><p>Verify your email using the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    } catch (emailError) {
      // The account is already created at this point - a broken SMTP
      // config shouldn't stop someone from registering. They can use
      // "resend verification email" once SMTP is fixed.
      console.error("Failed to send verification email:", emailError.message);
    }

    // Generate JWT
    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        profileCompleted: user.profileCompleted,
        isEmailVerified: user.isEmailVerified,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Login User
// =========================

const loginUser = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been suspended. Contact an administrator.",
      });
    }

    // Generate JWT
    const token = generateToken(user._id, Boolean(rememberMe));

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        profileCompleted: user.profileCompleted,
        isEmailVerified: user.isEmailVerified,
        settings: user.settings,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Forgot Password
// =========================
// Always responds with a generic success message, whether or not the
// email exists - this prevents attackers from using this endpoint to
// discover which emails are registered.
const forgotPassword = async (req, res) => {
  try {
    const { sendEmail } = require("../utils/sendEmail");
    const { generateSecureToken } = require("../utils/tokenHelper");

    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const genericResponse = {
      success: true,
      message: "If an account exists for that email, a reset link has been sent.",
    };

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    const { rawToken, hashedToken } = generateSecureToken();

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your CampusLink password",
        text: `Hi ${user.firstName}, reset your password using this link (valid for 30 minutes): ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
        html: `<p>Hi ${user.firstName},</p><p>Reset your password using the link below (valid for 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
      });
    } catch (emailError) {
      // The reset token is already saved - a broken SMTP config shouldn't
      // turn into a 500 here, and doing so could also leak (via a
      // different status code) whether the account exists.
      console.error("Failed to send password reset email:", emailError.message);
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Reset Password
// =========================
const resetPassword = async (req, res) => {
  try {
    const { hashToken } = require("../utils/tokenHelper");

    const { token } = req.params;
    const { password } = req.body || {};

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Verify Email
// =========================
const verifyEmail = async (req, res) => {
  try {
    const { hashToken } = require("../utils/tokenHelper");

    const hashedToken = hashToken(req.params.token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This verification link is invalid or has expired.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Resend Verification Email
// =========================
const resendVerification = async (req, res) => {
  try {
    const { generateSecureToken } = require("../utils/tokenHelper");
    const { sendEmail } = require("../utils/sendEmail");

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified." });
    }

    const { rawToken, hashedToken } = generateSecureToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your CampusLink email",
      text: `Hi ${user.firstName}, verify your email using this link: ${verifyUrl}`,
      html: `<p>Hi ${user.firstName},</p><p>Verify your email using the link below:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Couldn't send the verification email. If you're the site admin, check SMTP settings (see EMAIL_SETUP.md) - the raw error is in the server logs.",
    });
  }
};

// =========================
// Change Password (while logged in)
// =========================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are both required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
};