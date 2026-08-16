const Discussion = require("../models/Discussion");
const DiscussionReply = require("../models/DiscussionReply");

// =============================
// Create Discussion Thread
// =============================
const createDiscussion = async (req, res) => {
  try {
    const { title, content, courseCode } = req.body;

    if (!title?.trim() || !content?.trim() || !courseCode?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title, course code, and content are all required.",
      });
    }

    const discussion = await Discussion.create({
      title: title.trim(),
      content: content.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      author: req.user.id,
    });

    return res.status(201).json({ success: true, discussion });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// List / Search / Filter Discussions
// =============================
const getDiscussions = async (req, res) => {
  try {
    const { courseCode = "", search = "" } = req.query;

    const filter = {};
    if (courseCode) filter.courseCode = String(courseCode).toUpperCase();
    if (search) filter.$text = { $search: String(search) };

    const discussions = await Discussion.find(filter)
      .populate("author", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, discussions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Get One Discussion + Replies
// =============================
const getDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id).populate(
      "author",
      "firstName lastName username avatar"
    );

    if (!discussion) {
      return res.status(404).json({ success: false, message: "Discussion not found." });
    }

    const replies = await DiscussionReply.find({ discussion: req.params.id })
      .populate("author", "firstName lastName username avatar")
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, discussion, replies });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Reply
// =============================
const addReply = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Reply cannot be empty." });
    }

    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, message: "Discussion not found." });
    }

    const reply = await DiscussionReply.create({
      discussion: req.params.id,
      author: req.user.id,
      content: content.trim(),
    });

    discussion.repliesCount += 1;
    await discussion.save();

    const populated = await reply.populate("author", "firstName lastName username avatar");

    return res.status(201).json({ success: true, reply: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Delete (author or admin)
// =============================
const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ success: false, message: "Discussion not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (discussion.author.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await DiscussionReply.deleteMany({ discussion: discussion._id });
    await discussion.deleteOne();

    return res.status(200).json({ success: true, message: "Discussion deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDiscussion,
  getDiscussions,
  getDiscussion,
  addReply,
  deleteDiscussion,
};
