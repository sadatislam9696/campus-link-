const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getConversations,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
} = require("../controllers/messageController");

router.get("/conversations", authMiddleware, getConversations);

// Message-specific routes use a distinct "/message" prefix so they're
// never confused with the "/:userId" routes below.
router.put("/message/:messageId", authMiddleware, updateMessage);
router.delete("/message/:messageId", authMiddleware, deleteMessage);

router.get("/:userId", authMiddleware, getMessages);
router.post("/:userId", authMiddleware, sendMessage);

module.exports = router;
