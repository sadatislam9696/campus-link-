const StudyGroup = require("../models/StudyGroup");
const GroupPost = require("../models/GroupPost");

// =============================
// Create Group
// =============================
const createGroup = async (req, res) => {
  try {
    const { name, description, subject, type } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Group name is required." });
    }

    const group = await StudyGroup.create({
      name: name.trim(),
      description: description?.trim() || "",
      subject: subject?.trim() || "",
      type: type === "club" ? "club" : "study",
      creator: req.user.id,
      members: [req.user.id],
    });

    return res.status(201).json({ success: true, group });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// List / Search Groups
// =============================
const getGroups = async (req, res) => {
  try {
    const { search = "", type = "" } = req.query;

    const filter = {};
    if (search) filter.$text = { $search: String(search) };
    if (type === "study" || type === "club") filter.type = type;

    const groups = await StudyGroup.find(filter)
      .populate("creator", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    const withMeta = groups.map((g) => ({
      ...g.toObject(),
      memberCount: g.members.length,
      isMember: g.members.some((m) => m.toString() === req.user.id),
    }));

    return res.status(200).json({ success: true, groups: withMeta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Get Single Group
// =============================
const getGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id)
      .populate("creator", "firstName lastName username avatar")
      .populate("members", "firstName lastName username avatar");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const isMember = group.members.some((m) => m._id.toString() === req.user.id);

    return res.status(200).json({
      success: true,
      group: { ...group.toObject(), isMember },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Join / Leave
// =============================
const joinGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!group.members.some((m) => m.toString() === req.user.id)) {
      group.members.push(req.user.id);
      await group.save();
    }

    return res.status(200).json({ success: true, message: "Joined group." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (group.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "The creator can't leave their own group. Delete it instead.",
      });
    }

    group.members = group.members.filter((m) => m.toString() !== req.user.id);
    await group.save();

    return res.status(200).json({ success: true, message: "Left group." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Delete Group (creator only)
// =============================
const deleteGroup = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (group.creator.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Only the creator can delete this group." });
    }

    await GroupPost.deleteMany({ group: group._id });
    await group.deleteOne();

    return res.status(200).json({ success: true, message: "Group deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =============================
// Group Discussion Board (members only)
// =============================
const getGroupPosts = async (req, res) => {
  try {
    const group = await StudyGroup.findById(req.params.id).select("members");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!group.members.some((m) => m.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: "Join the group to see its discussion." });
    }

    const posts = await GroupPost.find({ group: req.params.id })
      .populate("author", "firstName lastName username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const createGroupPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Message cannot be empty." });
    }

    const group = await StudyGroup.findById(req.params.id).select("members");

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    if (!group.members.some((m) => m.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: "Join the group to post." });
    }

    const post = await GroupPost.create({
      group: req.params.id,
      author: req.user.id,
      content: content.trim(),
    });

    const populated = await post.populate("author", "firstName lastName username avatar");

    return res.status(201).json({ success: true, post: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupPosts,
  createGroupPost,
};
