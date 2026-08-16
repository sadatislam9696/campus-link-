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
} = require("../controllers/teamController");

router.get("/", authMiddleware, getTeams);
router.post("/", authMiddleware, createTeam);
router.get("/:id", authMiddleware, getTeam);
router.delete("/:id", authMiddleware, deleteTeam);
router.post("/:id/join", authMiddleware, joinTeam);
router.post("/:id/leave", authMiddleware, leaveTeam);

module.exports = router;
