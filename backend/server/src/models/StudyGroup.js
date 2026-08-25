const mongoose = require("mongoose");

const studyGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    type: {
      type: String,
      enum: ["study", "club"],
      default: "study",
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // Free-text course/subject label, e.g. "CSE 220" or "Data Structures".
    // Not a strict enum since every university names courses differently.
    subject: {
      type: String,
      default: "",
      trim: true,
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
  },
  {
    timestamps: true,
  }
);

studyGroupSchema.index({ name: "text", subject: "text", description: "text" });

module.exports = mongoose.model("StudyGroup", studyGroupSchema);
