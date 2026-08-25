const Note = require("../models/Note");
const fs = require("fs");
const path = require("path");

const createNote = async (req, res) => {
  try {
    const { title, courseCode, description } = req.body;

    if (!title?.trim() || !courseCode?.trim()) {
      return res.status(400).json({ success: false, message: "Title and course code are required." });
    }

    const note = await Note.create({
      title: title.trim(),
      courseCode: courseCode.trim().toUpperCase(),
      description: description?.trim() || "",
      fileUrl: req.file ? `/uploads/notes/${req.file.filename}` : "",
      fileName: req.file ? req.file.originalname : "",
      uploader: req.user.id,
    });

    const populated = await note.populate("uploader", "firstName lastName username avatar");

    return res.status(201).json({ success: true, note: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getNotes = async (req, res) => {
  try {
    const { courseCode = "", search = "" } = req.query;

    const filter = {};
    if (courseCode) filter.courseCode = String(courseCode).toUpperCase();
    if (search) filter.$text = { $search: String(search) };

    const notes = await Note.find(filter)
      .populate("uploader", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({ success: true, notes });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (note.uploader.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (note.fileUrl) {
      fs.unlink(path.join(__dirname, "..", note.fileUrl), (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete note file:", err.message);
        }
      });
    }

    await note.deleteOne();

    return res.status(200).json({ success: true, message: "Note removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createNote, getNotes, deleteNote };
