const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createGroup,
  getGroups,
  getGroup,
  joinGroup,
  leaveGroup,
  deleteGroup,
  getGroupPosts,
  createGroupPost,
} = require("../controllers/groupController");

router.get("/", authMiddleware, getGroups);
router.post("/", authMiddleware, createGroup);

router.get("/:id", authMiddleware, getGroup);
router.delete("/:id", authMiddleware, deleteGroup);

router.post("/:id/join", authMiddleware, joinGroup);
router.post("/:id/leave", authMiddleware, leaveGroup);

router.get("/:id/posts", authMiddleware, getGroupPosts);
router.post("/:id/posts", authMiddleware, createGroupPost);

module.exports = router;
