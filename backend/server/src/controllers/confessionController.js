const Confession = require("../models/Confession");

// Strips the author field from a confession before it ever reaches a
// client response - this is what makes the feature "anonymous". Admins
// still have the raw author id in the DB for abuse moderation, but no
// API response (including admin-facing ones, for now) exposes it.
const toPublicConfession = (confession, userId) => {
  const obj = confession.toObject ? confession.toObject() : confession;
  const { author, ...rest } = obj;

  const result = { ...rest };
  result.isMine = author?.toString() === userId;

  if (result.poll) {
    result.pollMeta = {
      totalVotes: result.poll.options.reduce((sum, o) => sum + (o.votes?.length || 0), 0),
      myVoteIndex: result.poll.options.findIndex((o) =>
        o.votes?.some((id) => id.toString() === userId)
      ),
    };
  }

  result.likeCount = result.likes?.length || 0;
  result.isLiked = result.likes?.some((id) => id.toString() === userId) || false;
  delete result.likes;

  return result;
};

const createConfession = async (req, res) => {
  try {
    const { content, poll } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: "Confession cannot be empty." });
    }

    let pollData;

    if (poll?.question?.trim() && Array.isArray(poll.options)) {
      const options = poll.options.map((o) => String(o).trim()).filter(Boolean);
      if (options.length >= 2) {
        pollData = {
          question: poll.question.trim(),
          options: options.map((text) => ({ text, votes: [] })),
        };
      }
    }

    const confession = await Confession.create({
      content: content.trim(),
      author: req.user.id,
      poll: pollData,
    });

    return res.status(201).json({
      success: true,
      confession: toPublicConfession(confession, req.user.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getConfessions = async (req, res) => {
  try {
    const { onlyPolls = "false" } = req.query;

    const filter = onlyPolls === "true" ? { poll: { $exists: true } } : {};

    const confessions = await Confession.find(filter).sort({ createdAt: -1 }).limit(50);

    return res.status(200).json({
      success: true,
      confessions: confessions.map((c) => toPublicConfession(c, req.user.id)),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const toggleLike = async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);

    if (!confession) {
      return res.status(404).json({ success: false, message: "Confession not found." });
    }

    const already = confession.likes.some((id) => id.toString() === req.user.id);

    if (already) {
      confession.likes = confession.likes.filter((id) => id.toString() !== req.user.id);
    } else {
      confession.likes.push(req.user.id);
    }

    await confession.save();

    return res.status(200).json({ success: true, isLiked: !already, likeCount: confession.likes.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const confession = await Confession.findById(req.params.id);

    if (!confession || !confession.poll?.options?.length) {
      return res.status(404).json({ success: false, message: "This confession has no poll." });
    }

    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= confession.poll.options.length
    ) {
      return res.status(400).json({ success: false, message: "Invalid option." });
    }

    confession.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((id) => id.toString() !== req.user.id);
    });

    confession.poll.options[optionIndex].votes.push(req.user.id);
    confession.markModified("poll");
    await confession.save();

    return res.status(200).json({
      success: true,
      confession: toPublicConfession(confession, req.user.id),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Delete is admin-only (or the original poster, matched server-side by
// the hidden author field) - never exposed to the client which confession
// belongs to whom, but the owner can still manage their own.
const deleteConfession = async (req, res) => {
  try {
    const confession = await Confession.findById(req.params.id);

    if (!confession) {
      return res.status(404).json({ success: false, message: "Confession not found." });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (confession.author.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    await confession.deleteOne();

    return res.status(200).json({ success: true, message: "Confession removed." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createConfession,
  getConfessions,
  toggleLike,
  votePoll,
  deleteConfession,
};
