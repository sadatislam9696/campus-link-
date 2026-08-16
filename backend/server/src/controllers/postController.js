const Post = require("../models/Post");
const { createNotification } = require("../utils/notificationHelper");
const fs = require("fs");
const path = require("path");

// =============================
// Create Post
// =============================
const createPost = async (req, res) => {
  try {
    const { content, visibility, poll, category } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Post content is required.",
      });
    }

    const validCategory = ["general", "event", "question", "announcement"].includes(category)
      ? category
      : "general";

    let pollData = undefined;

    if (poll) {
      try {
        const parsed = typeof poll === "string" ? JSON.parse(poll) : poll;
        const options = (parsed.options || [])
          .map((o) => (typeof o === "string" ? o.trim() : ""))
          .filter(Boolean);

        if (parsed.question?.trim() && options.length >= 2) {
          pollData = {
            question: parsed.question.trim(),
            options: options.map((text) => ({ text, votes: [] })),
          };
        }
      } catch {
        // Malformed poll JSON - just skip attaching a poll rather than
        // failing the whole post.
      }
    }

    const post = await Post.create({
      author: req.user.id,
      content,
      visibility: visibility || "public",
      category: validCategory,
      image: req.files?.image?.[0]
        ? `/uploads/posts/${req.files.image[0].filename}`
        : "",
      video: req.files?.video?.[0]
        ? `/uploads/posts/${req.files.video[0].filename}`
        : "",
      document: req.files?.document?.[0]
        ? {
            url: `/uploads/posts/${req.files.document[0].filename}`,
            name: req.files.document[0].originalname,
          }
        : undefined,
      poll: pollData,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Get Feed
// =============================
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, category = "" } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 10));

    const filter = {};
    if (["general", "event", "question", "announcement"].includes(category)) {
      filter.category = category;
    }

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "firstName lastName username avatar")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Post.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      hasMore: pageNum * limitNum < total,
      posts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Get Posts By Username
// =============================
const getUserPosts = async (req, res) => {
  try {
    const User = require("../models/User");

    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("_id");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const posts = await Post.find({ author: user._id })
      .populate("author", "firstName lastName username avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: posts.length,
      posts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Vote on a Poll
// =============================
const votePoll = async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || !post.poll || !post.poll.options?.length) {
      return res.status(404).json({ success: false, message: "This post has no poll." });
    }

    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= post.poll.options.length
    ) {
      return res.status(400).json({ success: false, message: "Invalid option." });
    }

    // Single-choice: remove any existing vote from this user on any
    // option before adding the new one, so switching your vote just
    // moves it rather than letting you vote for two options at once.
    post.poll.options.forEach((opt) => {
      opt.votes = opt.votes.filter((id) => id.toString() !== req.user.id);
    });

    post.poll.options[optionIndex].votes.push(req.user.id);
    post.markModified("poll");
    await post.save();

    return res.status(200).json({ success: true, poll: post.poll });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Best-effort cleanup of everything a post might have uploaded (image,
// video, document) - a missing file should never block the delete itself.
const unlinkPostAttachments = (post) => {
  const paths = [post.image, post.video, post.document?.url].filter(Boolean);

  paths.forEach((relativePath) => {
    fs.unlink(path.join(__dirname, "..", relativePath), (err) => {
      if (err && err.code !== "ENOENT") {
        console.error("Failed to delete post attachment:", err.message);
      }
    });
  });
};

// =============================
// Like / Unlike
// =============================
const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = req.user.id;

    const liked = post.likes.find(
      (id) => id.toString() === userId
    );

    if (liked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );
    } else {
      post.likes.push(userId);
    }

    await post.save();

    if (!liked) {
      const User = require("../models/User");
      const liker = await User.findById(userId).select("firstName lastName");

      await createNotification({
        recipient: post.author,
        sender: userId,
        type: "like",
        post: post._id,
        message: `${liker.firstName} ${liker.lastName} liked your post.`,
      });
    }

    return res.status(200).json({
      success: true,
      liked: !liked,
      likes: post.likes.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =============================
// Update Post
// =============================
const updatePost = async (req, res) => {
  try {
    const { content, visibility } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    post.content = content || post.content;

    if (visibility) {
      post.visibility = visibility;
    }

    post.isEdited = true;

    await post.save();

    return res.json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =============================
// Delete Post
// =============================
const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const Comment = require("../models/Comment");
    await Comment.deleteMany({ post: post._id });

    unlinkPostAttachments(post);

    await post.deleteOne();

    return res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
module.exports = {
  createPost,
  getAllPosts,
  toggleLike,
  votePoll,
  updatePost,
  deletePost,
  getUserPosts,
  unlinkPostAttachments,
};