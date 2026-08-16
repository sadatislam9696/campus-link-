const Team = require("../models/Team");

const createTeam = async (req, res) => {
  try {
    const { name, description, type, category, maxMembers } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Team name is required." });
    }

    const team = await Team.create({
      name: name.trim(),
      description: description?.trim() || "",
      type: ["study", "project", "competition", "other"].includes(type) ? type : "project",
      category: ["academic", "social", "professional", "sport", "art"].includes(category)
        ? category
        : "academic",
      maxMembers: Math.min(50, Math.max(2, Number(maxMembers) || 10)),
      creator: req.user.id,
      members: [req.user.id],
    });

    const populated = await team.populate("creator", "firstName lastName username avatar");

    return res.status(201).json({ success: true, team: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTeams = async (req, res) => {
  try {
    const { search = "", type = "" } = req.query;

    const filter = {};
    if (search) filter.$text = { $search: String(search) };
    if (["study", "project", "competition", "other"].includes(type)) filter.type = type;

    const teams = await Team.find(filter)
      .populate("creator", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    const withMeta = teams.map((t) => ({
      ...t.toObject(),
      memberCount: t.members.length,
      isMember: t.members.some((m) => m.toString() === req.user.id),
      isFull: t.members.length >= t.maxMembers,
    }));

    return res.status(200).json({ success: true, teams: withMeta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("creator", "firstName lastName username avatar")
      .populate("members", "firstName lastName username avatar");

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    return res.status(200).json({
      success: true,
      team: {
        ...team.toObject(),
        isMember: team.members.some((m) => m._id.toString() === req.user.id),
        isFull: team.members.length >= team.maxMembers,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const joinTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    if (team.members.some((m) => m.toString() === req.user.id)) {
      return res.status(400).json({ success: false, message: "You're already on this team." });
    }

    if (team.members.length >= team.maxMembers) {
      return res.status(400).json({ success: false, message: "This team is full." });
    }

    team.members.push(req.user.id);
    await team.save();

    return res.status(200).json({ success: true, message: "Joined team." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const leaveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    if (team.creator.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "The creator can't leave their own team. Delete it instead.",
      });
    }

    team.members = team.members.filter((m) => m.toString() !== req.user.id);
    await team.save();

    return res.status(200).json({ success: true, message: "Left team." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (team.creator.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await team.deleteOne();

    return res.status(200).json({ success: true, message: "Team deleted." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createTeam, getTeams, getTeam, joinTeam, leaveTeam, deleteTeam };
