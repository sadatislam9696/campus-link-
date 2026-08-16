const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createDiscussion,
  getDiscussions,
  getDiscussion,
  addReply,
  deleteDiscussion,
} = require("../controllers/discussionController");

router.get("/", authMiddleware, getDiscussions);
router.post("/", authMiddleware, createDiscussion);

router.get("/:id", authMiddleware, getDiscussion);
router.delete("/:id", authMiddleware, deleteDiscussion);

router.post("/:id/replies", authMiddleware, addReply);

module.exports = router;
