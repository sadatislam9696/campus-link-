const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
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

    image: {
      type: String,
      default: "",
    },

    video: {
      type: String,
      default: "",
    },

    document: {
      url: { type: String, default: "" },
      name: { type: String, default: "" },
    },

    visibility: {
      type: String,
      enum: ["public", "friends", "private"],
      default: "public",
    },

    category: {
      type: String,
      enum: ["general", "event", "question", "announcement"],
      default: "general",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    commentsCount: {
      type: Number,
      default: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
    },

    isEdited: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);