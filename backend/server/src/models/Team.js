const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    type: {
      type: String,
      enum: ["study", "project", "competition", "other"],
      default: "project",
    },

    category: {
      type: String,
      enum: ["academic", "social", "professional", "sport", "art"],
      default: "academic",
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 50,
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Team", teamSchema);
