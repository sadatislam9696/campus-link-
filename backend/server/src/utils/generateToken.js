const jwt = require("jsonwebtoken");

// Default session matches the previous behavior (7 days); "Remember Me"
// extends that to 30 days so it's a genuine upgrade, not a regression.
const generateToken = (userId, rememberMe = false) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? "30d" : "7d",
    }
  );
};

module.exports = generateToken;
