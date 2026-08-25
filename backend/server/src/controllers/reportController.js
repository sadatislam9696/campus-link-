const Report = require("../models/Report");
const Post = require("../models/Post");
const User = require("../models/User");

// =============================
// Create Report
// =============================
const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!["post", "user"].includes(targetType)) {
      return res.status(400).json({ success: false, message: "Invalid report target." });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Please describe the issue." });
    }

    const Model = targetType === "post" ? Post : User;
    const target = await Model.findById(targetId);

    if (!target) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    const report = await Report.create({
      reporter: req.user.id,
      targetType,
      targetId,
      reason: reason.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Thanks for the report - our team will review it.",
      report,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReport };
