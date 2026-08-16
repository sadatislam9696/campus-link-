const mongoose = require("mongoose");

const groupPostSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyGroup",
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
      maxlength: 3000,
    },
  },
  {
    timestamps: true,
  }
);

groupPostSchema.index({ group: 1, createdAt: -1 });

module.exports = mongoose.model("GroupPost", groupPostSchema);
