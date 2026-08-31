const multer = require("multer");
const path = require("path");

// Vercel-er read-only disk environment-er jonno memoryStorage use kora hochche
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = /jpg|jpeg|png|gif|webp/;

  const ext = allowed.test(
    path.extname(file.originalname).toLowerCase()
  );

  const mime = allowed.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

module.exports = upload;
