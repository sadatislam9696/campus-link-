const GroupConversation = require("../models/GroupConversation");
const GroupMessage = require("../models/GroupMessage");
const User = require("../models/User");

// =============================
// Create Group Conversation
// =============================
// Members must all be friends of the creator - same trust boundary as
// 1-on-1 chat, so group chat can't be used to spam strangers either.
const createConversation = async (req, res) => {
  try {
    const { name, memberIds } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required." });
    }

    const ids = Array.isArray(memberIds) ? [...new Set(memberIds)] : [];

    if (ids.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Pick at least 2 other people to start a group chat.",
      });
    }

    const me = await User.findById(req.user.id).select("friends");
    const friendIds = new Set(me.friends.map((f) => f.toString()));

    const allFriends = ids.every((id) => friendIds.has(id));
    if (!allFriends) {
      return res.status(403).json({
        success: false,
        message: "You can only add friends to a group chat.",
      });
    }

    const conversation = await GroupConversation.create({
      name: name.trim(),
      creator: req.user.id,
      members: [req.user.id, ...ids],
    });

    const populated = await conversation.populate("members", "firstName lastName username avatar");

    return res.status(201).json({ success: true, conversation: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// List My Group Conversations
// =============================
const getMyConversations = async (req, res) => {
  try {
    const conversations = await GroupConversation.find({ members: req.user.id })
      .populate("members", "firstName lastName username avatar")
      .sort({ updatedAt: -1 });

    const withPreview = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = await GroupMessage.findOne({ conversation: c._id })
          .sort({ createdAt: -1 })
          .select("text createdAt sender");

        const unreadCount = await GroupMessage.countDocuments({
          conversation: c._id,
          seenBy: { $ne: req.user.id },
          sender: { $ne: req.user.id },
        });

        return {
          ...c.toObject(),
          lastMessage: lastMessage?.text || "",
          lastMessageAt: lastMessage?.createdAt || c.createdAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ success: true, conversations: withPreview });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Get One Conversation + Messages
// =============================
const getConversation = async (req, res) => {
  try {
    const conversation = await GroupConversation.findById(req.params.id).populate(
      "members",
      "firstName lastName username avatar"
    );

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group chat not found." });
    }

    if (!conversation.members.some((m) => m._id.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: "You're not a member of this group." });
    }

    const messages = await GroupMessage.find({ conversation: conversation._id })
      .populate("sender", "firstName lastName username avatar")
      .sort({ createdAt: 1 });

    // Opening the thread marks everything as seen by this user.
    await GroupMessage.updateMany(
      { conversation: conversation._id, seenBy: { $ne: req.user.id } },
      { $addToSet: { seenBy: req.user.id } }
    );

    return res.status(200).json({ success: true, conversation, messages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Send Message (REST fallback)
// =============================
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const conversation = await GroupConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group chat not found." });
    }

    if (!conversation.members.some((m) => m.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: "You're not a member of this group." });
    }

    const message = await GroupMessage.create({
      conversation: conversation._id,
      sender: req.user.id,
      text: text.trim(),
      seenBy: [req.user.id],
    });

    conversation.updatedAt = new Date();
    await conversation.save();

    const populated = await message.populate("sender", "firstName lastName username avatar");

    try {
      const { emitToConversation } = require("../socket/socket");
      emitToConversation(conversation._id.toString(), "newGroupMessage", populated);
    } catch (error) {
      console.error("Socket emit failed for REST group message:", error.message);
    }

    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Add Member (creator only)
// =============================
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = await GroupConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group chat not found." });
    }

    if (conversation.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the group creator can add members." });
    }

    const me = await User.findById(req.user.id).select("friends");
    if (!me.friends.some((f) => f.toString() === userId)) {
      return res.status(403).json({ success: false, message: "You can only add friends to the group." });
    }

    if (!conversation.members.some((m) => m.toString() === userId)) {
      conversation.members.push(userId);
      await conversation.save();
    }

    return res.status(200).json({ success: true, message: "Member added." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Leave Conversation
// =============================
const leaveConversation = async (req, res) => {
  try {
    const conversation = await GroupConversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group chat not found." });
    }

    conversation.members = conversation.members.filter((m) => m.toString() !== req.user.id);

    if (conversation.members.length === 0) {
      await conversation.deleteOne();
      await GroupMessage.deleteMany({ conversation: conversation._id });
      return res.status(200).json({ success: true, message: "Left group. Conversation removed (empty)." });
    }

    // If the creator leaves, hand ownership to the next member so the
    // group isn't left without anyone able to manage it.
    if (conversation.creator.toString() === req.user.id) {
      conversation.creator = conversation.members[0];
    }

    await conversation.save();

    return res.status(200).json({ success: true, message: "Left group." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Edit Group Message (author only)
// =============================
const updateMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const message = await GroupMessage.findById(req.params.messageId);

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

    const populated = await message.populate("sender", "firstName lastName username avatar");

    try {
      const { emitToConversation } = require("../socket/socket");
      emitToConversation(message.conversation.toString(), "groupMessageUpdated", populated);
    } catch (error) {
      console.error("Socket emit failed for group message edit:", error.message);
    }

    return res.status(200).json({ success: true, message: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Delete Group Message (author only, soft delete)
// =============================
const deleteMessage = async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.messageId);

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
      const { emitToConversation } = require("../socket/socket");
      emitToConversation(message.conversation.toString(), "groupMessageDeleted", { _id: message._id });
    } catch (error) {
      console.error("Socket emit failed for group message delete:", error.message);
    }

    return res.status(200).json({ success: true, message: "Message deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createConversation,
  getMyConversations,
  getConversation,
  sendMessage,
  updateMessage,
  deleteMessage,
  addMember,
  leaveConversation,
};
