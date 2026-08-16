const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createAssignment,
  getAssignments,
  toggleCompleted,
  deleteAssignment,
} = require("../controllers/assignmentController");

router.get("/", authMiddleware, getAssignments);
router.post("/", authMiddleware, createAssignment);
router.post("/:id/complete", authMiddleware, toggleCompleted);
router.delete("/:id", authMiddleware, deleteAssignment);

module.exports = router;
