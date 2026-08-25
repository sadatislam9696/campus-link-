const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "src/uploads/posts";

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

// Which extensions are allowed depends on which form field the file came
// in on - an "image" field shouldn't accept a .mp4, etc.
const ALLOWED_BY_FIELD = {
  image: /jpg|jpeg|png|gif|webp/,
  video: /mp4|webm|mov/,
  document: /pdf|docx?|pptx?|zip/,
};

const fileFilter = (req, file, cb) => {
  const allowed = ALLOWED_BY_FIELD[file.fieldname];
  const ext = allowed && allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type for "${file.fieldname}".`));
  }
};

// A single shared ceiling across image/video/document uploads - multer
// doesn't support different limits per field, so this is sized for the
// largest case (video) rather than the smallest (image).
module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});
