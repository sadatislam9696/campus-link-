const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    // Free-text course code, e.g. "CSE 220". Used to group/filter threads.
    courseCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    repliesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

discussionSchema.index({ courseCode: 1, createdAt: -1 });
discussionSchema.index({ title: "text", content: "text", courseCode: "text" });

module.exports = mongoose.model("Discussion", discussionSchema);
