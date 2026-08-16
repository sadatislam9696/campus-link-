const mongoose = require("mongoose");

const lostFoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 800,
    },

    category: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },

    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

lostFoundSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("LostFoundItem", lostFoundSchema);
