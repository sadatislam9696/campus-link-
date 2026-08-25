const Assignment = require("../models/Assignment");

const createAssignment = async (req, res) => {
  try {
    const { title, description, courseCode, dueDate } = req.body;

    if (!title?.trim() || !courseCode?.trim() || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title, course code, and due date are required.",
      });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description?.trim() || "",
      courseCode: courseCode.trim().toUpperCase(),
      dueDate: new Date(dueDate),
      creator: req.user.id,
    });

    return res.status(201).json({ success: true, assignment });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAssignments = async (req, res) => {
  try {
    const { courseCode = "" } = req.query;

    const filter = {};
    if (courseCode) filter.courseCode = String(courseCode).toUpperCase();

    const assignments = await Assignment.find(filter)
      .populate("creator", "firstName lastName username avatar")
      .sort({ dueDate: 1 })
      .limit(100);

    const withMeta = assignments.map((a) => ({
      ...a.toObject(),
      isCompleted: a.completedBy.some((id) => id.toString() === req.user.id),
    }));

    return res.status(200).json({ success: true, assignments: withMeta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleCompleted = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const already = assignment.completedBy.some((id) => id.toString() === req.user.id);

    if (already) {
      assignment.completedBy = assignment.completedBy.filter((id) => id.toString() !== req.user.id);
    } else {
      assignment.completedBy.push(req.user.id);
    }

    await assignment.save();

    return res.status(200).json({ success: true, isCompleted: !already });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (assignment.creator.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await assignment.deleteOne();

    return res.status(200).json({ success: true, message: "Assignment removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAssignment, getAssignments, toggleCompleted, deleteAssignment };
