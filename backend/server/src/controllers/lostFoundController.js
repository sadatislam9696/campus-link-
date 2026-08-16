const LostFoundItem = require("../models/LostFoundItem");
const fs = require("fs");
const path = require("path");

const createItem = async (req, res) => {
  try {
    const { title, description, category, location } = req.body;

    if (!title?.trim() || !["lost", "found"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Title and a valid category (lost/found) are required.",
      });
    }

    const item = await LostFoundItem.create({
      title: title.trim(),
      description: description?.trim() || "",
      category,
      location: location?.trim() || "",
      image: req.files?.image?.[0]
        ? `/uploads/posts/${req.files.image[0].filename}`
        : "",
      postedBy: req.user.id,
    });

    const populated = await item.populate("postedBy", "firstName lastName username avatar");

    return res.status(201).json({ success: true, item: populated });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getItems = async (req, res) => {
  try {
    const { category = "", status = "open" } = req.query;

    const filter = {};
    if (category === "lost" || category === "found") filter.category = category;
    if (status === "open" || status === "resolved") filter.status = status;

    const items = await LostFoundItem.find(filter)
      .populate("postedBy", "firstName lastName username avatar")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleResolved = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (item.postedBy.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    item.status = item.status === "open" ? "resolved" : "open";
    await item.save();

    return res.status(200).json({ success: true, status: item.status });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await LostFoundItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (item.postedBy.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (item.image) {
      fs.unlink(path.join(__dirname, "..", item.image), (err) => {
        if (err && err.code !== "ENOENT") {
          console.error("Failed to delete lost & found image:", err.message);
        }
      });
    }

    await item.deleteOne();

    return res.status(200).json({ success: true, message: "Item removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createItem, getItems, toggleResolved, deleteItem };
