const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createConversation,
  getMyConversations,
  getConversation,
  sendMessage,
  updateMessage,
  deleteMessage,
  addMember,
  leaveConversation,
} = require("../controllers/groupChatController");

router.get("/", authMiddleware, getMyConversations);
router.post("/", authMiddleware, createConversation);

// Message-specific routes use a distinct "/messages" prefix so they're
// never confused with the "/:id" conversation routes below.
router.put("/messages/:messageId", authMiddleware, updateMessage);
router.delete("/messages/:messageId", authMiddleware, deleteMessage);

router.get("/:id", authMiddleware, getConversation);
router.post("/:id/messages", authMiddleware, sendMessage);
router.post("/:id/members", authMiddleware, addMember);
router.post("/:id/leave", authMiddleware, leaveConversation);

module.exports = router;
