const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
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
      maxlength: 1000,
    },

    courseCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Lets classmates who already submitted mark it off their own list.
    // Purely personal tracking, not proof of actual submission.
    completedBy: [
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

assignmentSchema.index({ courseCode: 1, dueDate: 1 });

module.exports = mongoose.model("Assignment", assignmentSchema);
