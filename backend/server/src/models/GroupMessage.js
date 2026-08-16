const mongoose = require("mongoose");

const groupMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupConversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    // Who has seen the latest state of the conversation - simpler than
    // tracking per-message read receipts for a group thread.
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    isEdited: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

groupMessageSchema.index({ conversation: 1, createdAt: 1 });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);
