const express = require("express");

const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
} = require("../controllers/authController");

const { registerValidation, loginValidation } = require("../middleware/validators");
const authMiddleware = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

router.post("/register", authLimiter, registerValidation, registerUser);

router.post("/login", authLimiter, loginValidation, loginUser);

router.post("/forgot-password", authLimiter, forgotPassword);

router.post("/reset-password/:token", authLimiter, resetPassword);

router.post("/verify-email/:token", verifyEmail);

router.post("/resend-verification", authMiddleware, resendVerification);

router.put("/change-password", authMiddleware, changePassword);

module.exports = router;
