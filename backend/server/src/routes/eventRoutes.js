const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { createEvent, getEvents, toggleInterested, deleteEvent } = require("../controllers/eventController");

router.get("/", authMiddleware, getEvents);
router.post("/", authMiddleware, createEvent);
router.post("/:id/interested", authMiddleware, toggleInterested);
router.delete("/:id", authMiddleware, deleteEvent);

module.exports = router;
