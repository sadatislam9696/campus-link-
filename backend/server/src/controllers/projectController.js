const Project = require("../models/Project");

const createProject = async (req, res) => {
  try {
    const { title, description, type, githubUrl, demoUrl, tags } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: "Title and description are required." });
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      type: type === "research" ? "research" : "project",
      githubUrl: githubUrl?.trim() || "",
      demoUrl: demoUrl?.trim() || "",
      tags: Array.isArray(tags)
        ? tags
        : String(tags || "")
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
      creator: req.user.id,
    });

    const populated = await project.populate("creator", "firstName lastName username avatar");

    return res.status(201).json({ success: true, project: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const { type = "", search = "" } = req.query;

    const filter = {};
    if (type === "project" || type === "research") filter.type = type;
    if (search) filter.$text = { $search: String(search) };

    const projects = await Project.find(filter)
      .populate("creator", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    const withMeta = projects.map((p) => ({
      ...p.toObject(),
      likeCount: p.likes.length,
      isLiked: p.likes.some((id) => id.toString() === req.user.id),
    }));

    return res.status(200).json({ success: true, projects: withMeta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLikeProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const already = project.likes.some((id) => id.toString() === req.user.id);

    if (already) {
      project.likes = project.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      project.likes.push(req.user.id);
    }

    await project.save();

    return res.status(200).json({ success: true, isLiked: !already, likeCount: project.likes.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (project.creator.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await project.deleteOne();

    return res.status(200).json({ success: true, message: "Project removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createProject, getProjects, toggleLikeProject, deleteProject };
