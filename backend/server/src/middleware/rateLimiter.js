const { rateLimit } = require("express-rate-limit");

// The test suite fires many auth requests back-to-back from the same
// address in a matter of seconds - that's expected there, not the
// brute-force pattern this middleware exists to catch elsewhere.
const skipInTests = () => process.env.NODE_ENV === "test";

// Applies to login/register/forgot-password/reset-password - the
// endpoints most worth protecting against brute-force and credential
// stuffing attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: {
    success: false,
    message: "Too many attempts from this IP. Please try again in a few minutes.",
  },
});

// A looser, general-purpose limit across the rest of the API so normal
// usage (scrolling a feed, polling notifications) is never affected.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests,
  message: {
    success: false,
    message: "Too many requests. Please slow down and try again shortly.",
  },
});

module.exports = { authLimiter, generalLimiter };
