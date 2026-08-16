const fs = require("fs");
const path = require("path");
const User = require("../models/User");

// =========================
// Get Profile
// =========================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Update Profile
// =========================
const updateProfile = async (req, res) => {
  try {
    const {
      bio,
      major,
      academicYear,
      skills,
      university,
      department,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Note: we check `!== undefined` (not truthiness) so a field can be
    // intentionally cleared by submitting an empty string.
    if (bio !== undefined) user.bio = bio;
    if (major !== undefined) user.major = major;
    if (academicYear !== undefined) user.academicYear = academicYear;
    if (university !== undefined) user.university = university;
    if (department !== undefined) user.department = department;

    if (skills !== undefined) {
      // skills may arrive as an array already, or as a comma separated string
      user.skills = Array.isArray(skills)
        ? skills.map((s) => s.trim()).filter(Boolean)
        : String(skills)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
    }

    user.profileCompleted = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile Updated",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Get Public Profile (by username)
// =========================
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("-password -email");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Upload Avatar
// =========================
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldAvatar = user.avatar;

    user.avatar =
      "/uploads/avatars/" + req.file.filename;

    await user.save();

    if (oldAvatar) {
      fs.unlink(path.join(__dirname, "..", oldAvatar), (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete old avatar:", err.message);
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Upload Cover Photo
// =========================
const uploadCoverPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const oldCover = user.coverPhoto;

    user.coverPhoto = "/uploads/covers/" + req.file.filename;

    await user.save();

    if (oldCover) {
      fs.unlink(path.join(__dirname, "..", oldCover), (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete old cover photo:", err.message);
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cover photo uploaded successfully",
      coverPhoto: user.coverPhoto,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Update Settings
// =========================
const updateSettings = async (req, res) => {
  try {
    const { emailNotifications, autoPlayVideos, darkMode, profileVisibility } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (emailNotifications !== undefined) user.settings.emailNotifications = Boolean(emailNotifications);
    if (autoPlayVideos !== undefined) user.settings.autoPlayVideos = Boolean(autoPlayVideos);
    if (darkMode !== undefined) user.settings.darkMode = Boolean(darkMode);
    if (["public", "friends"].includes(profileVisibility)) {
      user.settings.profileVisibility = profileVisibility;
    }

    await user.save();

    return res.status(200).json({ success: true, settings: user.settings });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCoverPhoto,
  getPublicProfile,
  updateSettings,
};