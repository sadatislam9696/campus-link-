const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const coverUpload = require("../middleware/coverUploadMiddleware");

const {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCoverPhoto,
  getPublicProfile,
  updateSettings,
} = require("../controllers/profileController");

router.get("/", authMiddleware, getProfile);

router.put("/", authMiddleware, updateProfile);

router.put("/settings", authMiddleware, updateSettings);

router.post(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  uploadAvatar
);

router.post(
  "/cover",
  authMiddleware,
  coverUpload.single("cover"),
  uploadCoverPhoto
);

// Public profile lookup by username (must come after the routes above
// so "/" and "/avatar" are not swallowed by this dynamic route)
router.get("/:username", authMiddleware, getPublicProfile);

module.exports = router;