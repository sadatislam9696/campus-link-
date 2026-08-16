const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  addComment,
  getComments,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

router.post("/:postId", authMiddleware, addComment);
router.get("/:postId", authMiddleware, getComments);
router.put("/:id", authMiddleware, updateComment);
router.delete("/:id", authMiddleware, deleteComment);

module.exports = router;
