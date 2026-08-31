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
<<<<<<< HEAD
  getTeamPosts,
  createTeamPost,
=======
>>>>>>> bdf963ed51860aae2ec63171c37f5a0cd46451e8
} = require("../controllers/teamController");

router.get("/", authMiddleware, getTeams);
router.post("/", authMiddleware, createTeam);
router.get("/:id", authMiddleware, getTeam);
router.delete("/:id", authMiddleware, deleteTeam);
router.post("/:id/join", authMiddleware, joinTeam);
router.post("/:id/leave", authMiddleware, leaveTeam);
<<<<<<< HEAD
router.get("/:id/posts", authMiddleware, getTeamPosts);
router.post("/:id/posts", authMiddleware, createTeamPost);
=======
>>>>>>> bdf963ed51860aae2ec63171c37f5a0cd46451e8

module.exports = router;
