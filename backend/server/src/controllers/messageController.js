const Message = require("../models/Message");
const User = require("../models/User");
const { isUserOnline } = require("../socket/socket");

// =============================
// Get Conversation List
// =============================
// Returns one row per person the current user has exchanged messages
// with, each with their last message and unread count - like a chat
// app's inbox list.
const getConversations = async (req, res) => {
  try {
    const meId = req.user.id;

    const messages = await Message.find({
      $or: [{ sender: meId }, { receiver: meId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "firstName lastName username avatar")
      .populate("receiver", "firstName lastName username avatar");

    const conversations = new Map();

    for (const msg of messages) {
      const partner =
        msg.sender._id.toString() === meId ? msg.receiver : msg.sender;
      const partnerId = partner._id.toString();

      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, {
          user: partner,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          online: isUserOnline(partnerId),
        });
      }

      if (msg.receiver._id.toString() === meId && !msg.seen) {
        conversations.get(partnerId).unreadCount += 1;
      }
    }

    return res.status(200).json({
      success: true,
      conversations: [...conversations.values()],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Get Messages With A Specific User
// =============================
const getMessages = async (req, res) => {
  try {
    const meId = req.user.id;
    const otherUserId = req.params.userId;

    const otherUser = await User.findById(otherUserId).select(
      "firstName lastName username avatar"
    );

    if (!otherUser) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const messages = await Message.find({
      $or: [
        { sender: meId, receiver: otherUserId },
        { sender: otherUserId, receiver: meId },
      ],
    }).sort({ createdAt: 1 });

    // Opening the thread marks their messages to me as seen.
    await Message.updateMany(
      { sender: otherUserId, receiver: meId, seen: false },
      { $set: { seen: true } }
    );

    return res.status(200).json({
      success: true,
      otherUser,
      messages,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Send Message (REST fallback - primary path is the socket event,
// but this keeps chat usable even if the socket connection drops)
// =============================
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const receiverId = req.params.userId;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const sender = await User.findById(req.user.id).select("friends");

    if (!sender.friends.some((id) => id.toString() === receiverId)) {
      return res.status(403).json({
        success: false,
        message: "You can only message your friends.",
      });
    }

    const message = await Message.create({
      sender: req.user.id,
      receiver: receiverId,
      text: text.trim(),
    });

    // Also push it over the socket if the receiver happens to be online,
    // so REST-sent messages still show up live for them, without leaking
    // it to every other connected user.
    try {
      const { emitToUser } = require("../socket/socket");
      emitToUser(receiverId, "newMessage", message);
      emitToUser(req.user.id, "newMessage", message);
    } catch (error) {
      console.error("Socket emit failed for REST message:", error.message);
    }

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Edit Message (author only)
// =============================
const updateMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only edit your own messages." });
    }

    if (message.isDeleted) {
      return res.status(400).json({ success: false, message: "Can't edit a deleted message." });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    try {
      const { emitToUser } = require("../socket/socket");
      emitToUser(message.receiver.toString(), "messageUpdated", message);
      emitToUser(message.sender.toString(), "messageUpdated", message);
    } catch (error) {
      console.error("Socket emit failed for message edit:", error.message);
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Delete Message (author only, soft delete)
// =============================
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "You can only delete your own messages." });
    }

    message.isDeleted = true;
    message.text = "";
    await message.save();

    try {
      const { emitToUser } = require("../socket/socket");
      emitToUser(message.receiver.toString(), "messageDeleted", { _id: message._id });
      emitToUser(message.sender.toString(), "messageDeleted", { _id: message._id });
    } catch (error) {
      console.error("Socket emit failed for message delete:", error.message);
    }

    return res.status(200).json({ success: true, message: "Message deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
};
