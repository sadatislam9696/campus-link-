const multer = require("multer");
const path = require("path");
<<<<<<< HEAD
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = "src/uploads/avatars";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const fileName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, fileName);
  },
});
=======

// Vercel-er read-only disk environment-er jonno memoryStorage use kora hochche
const storage = multer.memoryStorage();
>>>>>>> bdf963ed51860aae2ec63171c37f5a0cd46451e8

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

<<<<<<< HEAD
module.exports = upload;
=======
module.exports = upload;
>>>>>>> bdf963ed51860aae2ec63171c37f5a0cd46451e8
