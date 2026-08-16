const mongoose = require("mongoose");

const discussionReplySchema = new mongoose.Schema(
  {
    discussion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Discussion",
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

discussionReplySchema.index({ discussion: 1, createdAt: 1 });

module.exports = mongoose.model("DiscussionReply", discussionReplySchema);
