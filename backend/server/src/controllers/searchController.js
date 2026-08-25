const User = require("../models/User");
const Post = require("../models/Post");
const { escapeRegex } = require("../utils/regexHelpers");

// =============================
// Combined Search (users + posts)
// =============================
const search = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q) {
      return res.status(200).json({
        success: true,
        query: "",
        users: [],
        posts: [],
      });
    }

    const pattern = new RegExp(escapeRegex(q), "i");

    const [users, posts] = await Promise.all([
      User.find({
        $or: [
          { firstName: pattern },
          { lastName: pattern },
          { username: pattern },
          { skills: pattern },
          { department: pattern },
          { university: pattern },
        ],
      })
        .select(
          "firstName lastName username avatar bio department university skills"
        )
        .limit(20),

      Post.find({ content: pattern })
        .populate("author", "firstName lastName username avatar")
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    return res.status(200).json({
      success: true,
      query: q,
      total: users.length + posts.length,
      users,
      posts,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  search,
};
