const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { createNotification } = require("../utils/notificationHelper");

// ======================================
// Add Comment (or Reply)
// ======================================

const addComment = async (req, res) => {
  try {
    const { text, parentComment } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    let parent = null;

    if (parentComment) {
      parent = await Comment.findById(parentComment);

      if (!parent || parent.post.toString() !== post._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Invalid comment to reply to.",
        });
      }

      // Keep nesting to one level: replying to a reply attaches to the
      // original top-level comment instead of chaining deeper.
      if (parent.parentComment) {
        parent = await Comment.findById(parent.parentComment);
      }
    }

    const comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      text,
      parentComment: parent ? parent._id : null,
    });

    post.commentsCount += 1;
    await post.save();

    const populated = await comment.populate(
      "author",
      "firstName lastName username avatar"
    );

    const User = require("../models/User");
    const commenter = await User.findById(req.user.id).select("firstName lastName");

    if (parent) {
      // Reply: notify whoever they're replying to (if that's not
      // themselves), separately from the post-owner notification below.
      if (parent.author.toString() !== req.user.id) {
        await createNotification({
          recipient: parent.author,
          sender: req.user.id,
          type: "comment",
          post: post._id,
          message: `${commenter.firstName} ${commenter.lastName} replied to your comment.`,
        });
      }
    }

    // Always let the post owner know too, unless they're the one who
    // already got notified above as the reply target.
    if (!parent || parent.author.toString() !== post.author.toString()) {
      await createNotification({
        recipient: post.author,
        sender: req.user.id,
        type: "comment",
        post: post._id,
        message: `${commenter.firstName} ${commenter.lastName} commented on your post.`,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Comment Added",
      comment: populated,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Get Comments
// ======================================

const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId,
    })
      .populate("author", "firstName lastName username avatar")
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      total: comments.length,
      comments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Edit Comment
// ======================================

const updateComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty",
      });
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    comment.text = text.trim();
    comment.isEdited = true;
    await comment.save();

    const populated = await comment.populate(
      "author",
      "firstName lastName username avatar"
    );

    return res.json({
      success: true,
      message: "Comment updated",
      comment: populated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Delete Comment
// ======================================

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const User = require("../models/User");
    const me = await User.findById(req.user.id).select("role");

    if (comment.author.toString() !== req.user.id && me.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // A top-level comment being deleted takes its replies with it, so
    // no reply is left pointing at a parent that no longer exists.
    const replies = await Comment.find({ parentComment: comment._id }).select("_id");
    const deletedCount = 1 + replies.length;

    await Comment.deleteMany({
      $or: [{ _id: comment._id }, { parentComment: comment._id }],
    });

    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -deletedCount },
    });

    return res.json({
      success: true,
      message: "Comment Deleted",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addComment,
  getComments,
  updateComment,
  deleteComment,
};
