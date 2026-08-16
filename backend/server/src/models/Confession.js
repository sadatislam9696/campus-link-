const mongoose = require("mongoose");

const confessionSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    // Stored for moderation (admin can still trace abuse) but never sent
    // to clients in API responses - that's what makes it "anonymous".
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    poll: {
      question: { type: String, trim: true, maxlength: 200 },
      options: [
        {
          text: { type: String, trim: true, maxlength: 100 },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        },
      ],
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  }
);

confessionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Confession", confessionSchema);
