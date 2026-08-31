const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createTeam,
  getTeams,
  getTeam,
  joinTeam,
  leaveTeam,
  deleteTeam,
  getTeamPosts,
  createTeamPost,
} = require("../controllers/teamController");

router.get("/", authMiddleware, getTeams);
router.post("/", authMiddleware, createTeam);
router.get("/:id", authMiddleware, getTeam);
router.delete("/:id", authMiddleware, deleteTeam);
router.post("/:id/join", authMiddleware, joinTeam);
router.post("/:id/leave", authMiddleware, leaveTeam);
router.get("/:id/posts", authMiddleware, getTeamPosts);
router.post("/:id/posts", authMiddleware, createTeamPost);

module.exports = router;
