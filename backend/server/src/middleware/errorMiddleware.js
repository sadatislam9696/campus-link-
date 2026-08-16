const multer = require("multer");

// Centralized error handler - must be registered LAST, after all routes.
// Anything passed to next(err), or thrown inside an async route handler
// that isn't individually try/caught, lands here instead of leaking an
// HTML stack trace to the client.
const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Multer-specific errors (file too large, too many files, etc.)
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field.",
      LIMIT_FILE_COUNT: "Too many files.",
    };

    return res.status(400).json({
      success: false,
      message: messages[err.code] || "File upload error.",
    });
  }

  // Errors thrown from a multer fileFilter (e.g. "Unsupported file type")
  // arrive here as plain Errors, not MulterError instances.
  if (err.message && /file type|files are allowed/i.test(err.message)) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const firstError = Object.values(err.errors)[0];
    return res.status(400).json({
      success: false,
      message: firstError?.message || "Validation failed.",
    });
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format.",
    });
  }

  console.error("Unhandled error:", err);

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Something went wrong on our end.",
  });
};

// 404 handler for routes that don't match anything above.
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = { errorHandler, notFoundHandler };
