const mongoose = require("mongoose");

const friendRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Speeds up the "is there already a pending request between these two"
// checks that run on every send/suggestions call.
friendRequestSchema.index({ sender: 1, receiver: 1 });

module.exports = mongoose.model("FriendRequest", friendRequestSchema);
