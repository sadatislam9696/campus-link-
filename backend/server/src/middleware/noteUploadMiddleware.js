const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = "src/uploads/notes";

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

// Matches the README's File Sharing spec: PDF, DOCX, PPT, ZIP, Images.
const fileFilter = (req, file, cb) => {
  const allowed = /pdf|docx?|pptx?|zip|jpg|jpeg|png|gif|webp/;

  const ext = allowed.test(path.extname(file.originalname).toLowerCase());

  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC(X), PPT(X), ZIP, or image files are allowed."));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // notes/slides can be bigger than a post image
  },
});
