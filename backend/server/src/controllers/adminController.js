const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Message = require("../models/Message");
const Report = require("../models/Report");
const FriendRequest = require("../models/FriendRequest");
const StudyGroup = require("../models/StudyGroup");
const GroupPost = require("../models/GroupPost");
const Team = require("../models/Team");
const Discussion = require("../models/Discussion");
const DiscussionReply = require("../models/DiscussionReply");
const Event = require("../models/Event");
const Note = require("../models/Note");
const Project = require("../models/Project");
const Assignment = require("../models/Assignment");
const LostFoundItem = require("../models/LostFoundItem");
const Confession = require("../models/Confession");
const GroupConversation = require("../models/GroupConversation");
const GroupMessage = require("../models/GroupMessage");
const Notification = require("../models/Notification");
const fs = require("fs");
const path = require("path");

// =============================
// Dashboard Stats
// =============================
const getStats = async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalMessages,
      totalFriendships,
      pendingReports,
      newUsersThisWeek,
      newPostsThisWeek,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Message.countDocuments(),
      FriendRequest.countDocuments({ status: "accepted" }),
      Report.countDocuments({ status: "pending" }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalComments,
        totalMessages,
        totalFriendships,
        pendingReports,
        newUsersThisWeek,
        newPostsThisWeek,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Users
// =============================
const getUsers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;
    const { escapeRegex } = require("../utils/regexHelpers");

    const filter = search
      ? {
          $or: [
            { firstName: new RegExp(escapeRegex(String(search)), "i") },
            { lastName: new RegExp(escapeRegex(String(search)), "i") },
            { username: new RegExp(escapeRegex(String(search)), "i") },
            { email: new RegExp(escapeRegex(String(search)), "i") },
          ],
        }
      : {};

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    return res.status(200).json({ success: true, users, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleBanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot ban another admin." });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: user.isActive ? "User unbanned." : "User banned.",
      isActive: user.isActive,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot delete another admin." });
    }

    const userId = user._id;

    // Best-effort cleanup of their content so deleted users don't leave
    // orphaned files or dangling relationships behind.
    const unlinkSafe = (relativePath) => {
      if (!relativePath) return;
      fs.unlink(path.join(__dirname, "..", relativePath), (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete file:", err.message);
        }
      });
    };

    const theirPosts = await Post.find({ author: userId }).select("image video document");
    unlinkSafe(user.avatar);
    unlinkSafe(user.coverPhoto);
    theirPosts.forEach((p) => {
      unlinkSafe(p.image);
      unlinkSafe(p.video);
      unlinkSafe(p.document?.url);
    });

    const theirLostFoundItems = await LostFoundItem.find({ postedBy: userId }).select("image");
    theirLostFoundItems.forEach((i) => unlinkSafe(i.image));

    const theirNotes = await Note.find({ uploader: userId }).select("fileUrl");
    theirNotes.forEach((n) => unlinkSafe(n.fileUrl));

    // Single-owner content: simplest and safest to remove outright, so no
    // other page ever has to render a post/note/confession/etc. whose
    // author no longer exists.
    await Post.deleteMany({ author: userId });
    await Comment.deleteMany({ author: userId });
    await LostFoundItem.deleteMany({ postedBy: userId });
    await Confession.deleteMany({ author: userId });
    await Note.deleteMany({ uploader: userId });
    await Event.deleteMany({ creator: userId });
    await Assignment.deleteMany({ creator: userId });
    await Discussion.deleteMany({ author: userId });
    await DiscussionReply.deleteMany({ author: userId });
    await GroupPost.deleteMany({ author: userId });
    await Project.deleteMany({ creator: userId });
    await Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });
    await Report.deleteMany({ reporter: userId });
    await FriendRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });

    // Shared-membership content: removing the user shouldn't wreck the
    // group for everyone else still in it, so hand off ownership or pull
    // membership instead of deleting outright.
    await User.updateMany({ friends: userId }, { $pull: { friends: userId } });
    await Project.updateMany({ collaborators: userId }, { $pull: { collaborators: userId } });
    await Event.updateMany({ interested: userId }, { $pull: { interested: userId } });
    await Assignment.updateMany({ completedBy: userId }, { $pull: { completedBy: userId } });

    for (const Model of [StudyGroup, Team]) {
      const owned = await Model.find({ creator: userId });
      for (const doc of owned) {
        doc.members = doc.members.filter((m) => m.toString() !== userId.toString());
        if (doc.members.length === 0) {
          await doc.deleteOne();
        } else {
          doc.creator = doc.members[0];
          await doc.save();
        }
      }
      await Model.updateMany({ members: userId }, { $pull: { members: userId } });
    }

    const ownedConversations = await GroupConversation.find({ creator: userId });
    for (const convo of ownedConversations) {
      convo.members = convo.members.filter((m) => m.toString() !== userId.toString());
      if (convo.members.length === 0) {
        await GroupMessage.deleteMany({ conversation: convo._id });
        await convo.deleteOne();
      } else {
        convo.creator = convo.members[0];
        await convo.save();
      }
    }
    await GroupConversation.updateMany({ members: userId }, { $pull: { members: userId } });

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ success: true, message: "User deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Posts
// =============================
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const posts = await Post.find()
      .populate("author", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Post.countDocuments();

    return res.status(200).json({ success: true, posts, total });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deletePostAsAdmin = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found." });
    }

    await Comment.deleteMany({ post: post._id });

    const { unlinkPostAttachments } = require("./postController");
    unlinkPostAttachments(post);

    await post.deleteOne();

    return res.status(200).json({ success: true, message: "Post removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Reports
// =============================
const getReports = async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    const reports = await Report.find({ status })
      .populate("reporter", "firstName lastName username")
      .sort({ createdAt: -1 });

    // Attach a small preview of the reported content so the admin doesn't
    // have to open a second tab to see what's being reported.
    const enriched = await Promise.all(
      reports.map(async (report) => {
        let target = null;

        if (report.targetType === "post") {
          target = await Post.findById(report.targetId)
            .select("content author")
            .populate("author", "firstName lastName username");
        } else {
          target = await User.findById(report.targetId).select(
            "firstName lastName username"
          );
        }

        return { ...report.toObject(), target };
      })
    );

    return res.status(200).json({ success: true, reports: enriched });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const resolveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found." });
    }

    report.status = "resolved";
    await report.save();

    return res.status(200).json({ success: true, message: "Report resolved." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getUsers,
  toggleBanUser,
  deleteUser,
  getPosts,
  deletePostAsAdmin,
  getReports,
  resolveReport,
};
