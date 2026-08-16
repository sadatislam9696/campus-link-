const { body, validationResult } = require("express-validator");

// Runs after the rule chains below and turns any failures into a single
// 400 response, so controllers never have to check validationResult
// themselves.
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }

  next();
};

const registerValidation = [
  body("firstName").trim().notEmpty().withMessage("First name is required."),
  body("lastName").trim().notEmpty().withMessage("Last name is required."),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required.")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be 3-20 characters.")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores."),
  body("email").trim().isEmail().withMessage("Please enter a valid email address."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
  handleValidationErrors,
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Please enter a valid email address."),
  body("password").notEmpty().withMessage("Password is required."),
  handleValidationErrors,
];

module.exports = { registerValidation, loginValidation, handleValidationErrors };
