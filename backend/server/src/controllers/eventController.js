const Event = require("../models/Event");

const createEvent = async (req, res) => {
  try {
    const { title, description, location, date } = req.body;

    if (!title?.trim() || !date) {
      return res.status(400).json({ success: false, message: "Title and date are required." });
    }

    const event = await Event.create({
      title: title.trim(),
      description: description?.trim() || "",
      location: location?.trim() || "",
      date: new Date(date),
      creator: req.user.id,
      interested: [req.user.id],
    });

    return res.status(201).json({ success: true, event });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getEvents = async (req, res) => {
  try {
    const { upcoming = "true" } = req.query;

    const filter = upcoming === "true" ? { date: { $gte: new Date() } } : {};

    const events = await Event.find(filter)
      .populate("creator", "firstName lastName username avatar")
      .sort({ date: 1 })
      .limit(100);

    const withMeta = events.map((e) => ({
      ...e.toObject(),
      interestedCount: e.interested.length,
      isInterested: e.interested.some((id) => id.toString() === req.user.id),
    }));

    return res.status(200).json({ success: true, events: withMeta });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleInterested = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const already = event.interested.some((id) => id.toString() === req.user.id);

    if (already) {
      event.interested = event.interested.filter((id) => id.toString() !== req.user.id);
    } else {
      event.interested.push(req.user.id);
    }

    await event.save();

    return res.status(200).json({ success: true, isInterested: !already });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (event.creator.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await event.deleteOne();

    return res.status(200).json({ success: true, message: "Event removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createEvent, getEvents, toggleInterested, deleteEvent };
