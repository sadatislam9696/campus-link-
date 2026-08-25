const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const { createNotification } = require("../utils/notificationHelper");

// =============================
// Send Friend Request
// =============================
const sendRequest = async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = req.user.id;

    if (receiverId === senderId) {
      return res.status(400).json({
        success: false,
        message: "You can't send a friend request to yourself.",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const sender = await User.findById(senderId);

    if (sender.friends.some((id) => id.toString() === receiverId)) {
      return res.status(400).json({
        success: false,
        message: "You are already friends.",
      });
    }

    const existing = await FriendRequest.findOne({
      status: "pending",
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A pending request already exists between you two.",
      });
    }

    const request = await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    await createNotification({
      recipient: receiverId,
      sender: senderId,
      type: "friend_request",
      message: `${sender.firstName} ${sender.lastName} sent you a friend request.`,
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent.",
      request,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Incoming / Sent Requests
// =============================
const getIncomingRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.id,
      status: "pending",
    })
      .populate("sender", "firstName lastName username avatar department university")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    })
      .populate("receiver", "firstName lastName username avatar department university")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Accept / Reject / Cancel
// =============================
const acceptRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request || request.status !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Friend request not found.",
      });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, {
      $addToSet: { friends: request.receiver },
    });
    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: { friends: request.sender },
    });

    const receiver = await User.findById(request.receiver);

    await createNotification({
      recipient: request.sender,
      sender: request.receiver,
      type: "friend_accept",
      message: `${receiver.firstName} ${receiver.lastName} accepted your friend request.`,
    });

    return res.status(200).json({ success: true, message: "Friend request accepted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request || request.status !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Friend request not found.",
      });
    }

    if (request.receiver.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    request.status = "rejected";
    await request.save();

    return res.status(200).json({ success: true, message: "Friend request rejected." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    if (!request || request.status !== "pending") {
      return res.status(404).json({
        success: false,
        message: "Friend request not found.",
      });
    }

    if (request.sender.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await request.deleteOne();

    return res.status(200).json({ success: true, message: "Friend request cancelled." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Remove Friend
// =============================
const removeFriend = async (req, res) => {
  try {
    const otherUserId = req.params.userId;

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { friends: otherUserId },
    });
    await User.findByIdAndUpdate(otherUserId, {
      $pull: { friends: req.user.id },
    });

    // Clean up any old accepted/rejected request records between the two
    // so a future friend request between them can be sent again cleanly.
    await FriendRequest.deleteMany({
      $or: [
        { sender: req.user.id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user.id },
      ],
    });

    return res.status(200).json({ success: true, message: "Friend removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Friends List (by username)
// =============================
const getFriendsList = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).populate("friends", "firstName lastName username avatar department university");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, friends: user.friends });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Friend Status (relative to logged-in user)
// =============================
const getFriendStatus = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const meId = req.user.id;

    if (otherUserId === meId) {
      return res.status(200).json({ success: true, status: "self" });
    }

    const me = await User.findById(meId).select("friends");

    if (me.friends.some((id) => id.toString() === otherUserId)) {
      return res.status(200).json({ success: true, status: "friends" });
    }

    const request = await FriendRequest.findOne({
      status: "pending",
      $or: [
        { sender: meId, receiver: otherUserId },
        { sender: otherUserId, receiver: meId },
      ],
    });

    if (request) {
      const status =
        request.sender.toString() === meId ? "pending_sent" : "pending_received";
      return res.status(200).json({ success: true, status, requestId: request._id });
    }

    return res.status(200).json({ success: true, status: "none" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Friend Suggestions
// =============================
const getSuggestions = async (req, res) => {
  try {
    const me = await User.findById(req.user.id).select("friends university department");

    const pending = await FriendRequest.find({
      status: "pending",
      $or: [{ sender: req.user.id }, { receiver: req.user.id }],
    });

    const excludeIds = new Set([
      req.user.id,
      ...me.friends.map((id) => id.toString()),
      ...pending.map((r) =>
        r.sender.toString() === req.user.id ? r.receiver.toString() : r.sender.toString()
      ),
    ]);

    // Prefer people from the same university/department, fall back to
    // anyone else so the list is never empty on a small dataset.
    const orConditions = [];
    if (me.university) orConditions.push({ university: me.university });
    if (me.department) orConditions.push({ department: me.department });

    let suggestions = [];

    if (orConditions.length) {
      suggestions = await User.find({
        _id: { $nin: [...excludeIds] },
        $or: orConditions,
      })
        .select("firstName lastName username avatar department university")
        .limit(10);
    }

    if (suggestions.length < 10) {
      const more = await User.find({
        _id: { $nin: [...excludeIds, ...suggestions.map((s) => s._id.toString())] },
      })
        .select("firstName lastName username avatar department university")
        .limit(10 - suggestions.length);

      suggestions = [...suggestions, ...more];
    }

    return res.status(200).json({ success: true, suggestions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  sendRequest,
  getIncomingRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  removeFriend,
  getFriendsList,
  getFriendStatus,
  getSuggestions,
};
