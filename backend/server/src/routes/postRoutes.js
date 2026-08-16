const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/postUploadMiddleware");

const {
  createPost,
  getAllPosts,
  toggleLike,
  votePoll,
  updatePost,
  deletePost,
  getUserPosts,
} = require("../controllers/postController");

// Feed
router.get("/", authMiddleware, getAllPosts);

// Posts by a specific user (must come before "/:id" style routes below
// don't conflict since this is prefixed with "/user")
router.get("/user/:username", authMiddleware, getUserPosts);

// Create Post
router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  createPost
);

// Update Post
router.put("/:id", authMiddleware, updatePost);

// Delete Post
router.delete("/:id", authMiddleware, deletePost);

// Like
router.post("/:id/like", authMiddleware, toggleLike);

// Vote on a poll
router.post("/:id/vote", authMiddleware, votePoll);

module.exports = router;