const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    courseCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    // Path under /uploads/notes/<filename>, or empty if the note is
    // text-only (e.g. a summary with no attachment).
    fileUrl: {
      type: String,
      default: "",
    },

    fileName: {
      type: String,
      default: "",
    },

    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

noteSchema.index({ courseCode: 1, createdAt: -1 });
noteSchema.index({ title: "text", courseCode: "text", description: "text" });

module.exports = mongoose.model("Note", noteSchema);
