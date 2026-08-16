const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createProject,
  getProjects,
  toggleLikeProject,
  deleteProject,
} = require("../controllers/projectController");

router.get("/", authMiddleware, getProjects);
router.post("/", authMiddleware, createProject);
router.post("/:id/like", authMiddleware, toggleLikeProject);
router.delete("/:id", authMiddleware, deleteProject);

module.exports = router;
