const mongoose = require("mongoose");

const teamPostSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
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

teamPostSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.model("TeamPost", teamPostSchema);
