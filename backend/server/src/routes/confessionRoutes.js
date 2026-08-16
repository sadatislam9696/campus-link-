const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  createConfession,
  getConfessions,
  toggleLike,
  votePoll,
  deleteConfession,
} = require("../controllers/confessionController");

router.get("/", authMiddleware, getConfessions);
router.post("/", authMiddleware, createConfession);
router.post("/:id/like", authMiddleware, toggleLike);
router.post("/:id/vote", authMiddleware, votePoll);
router.delete("/:id", authMiddleware, deleteConfession);

module.exports = router;
