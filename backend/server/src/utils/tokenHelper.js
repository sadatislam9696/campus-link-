const crypto = require("crypto");

// Returns both the raw token (sent to the user via email/link) and its
// SHA-256 hash (stored in the DB). We never store the raw token, so a
// database leak alone can't be used to reset someone's password or
// verify their email.
const generateSecureToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  return { rawToken, hashedToken };
};

const hashToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

module.exports = { generateSecureToken, hashToken };
