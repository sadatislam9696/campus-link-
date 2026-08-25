const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    // Profile
    bio: {
      type: String,
      default: "",
    },

    university: {
      type: String,
      default: "",
      trim: true,
    },

    department: {
      type: String,
      default: "",
      trim: true,
    },

    major: {
      type: String,
      default: "",
    },

    academicYear: {
      type: String,
      enum: [
        "",
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "Graduate",
      ],
      default: "",
    },

    skills: [
      {
        type: String,
        trim: true,
      },
    ],

    avatar: {
      type: String,
      default: "",
    },

    coverPhoto: {
      type: String,
      default: "",
    },

    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    resetPasswordToken: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
      select: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    settings: {
      emailNotifications: { type: Boolean, default: true },
      autoPlayVideos: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
      profileVisibility: {
        type: String,
        enum: ["public", "friends"],
        default: "public",
      },
    },

    // Status
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);