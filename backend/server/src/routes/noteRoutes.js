const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/noteUploadMiddleware");
const { createNote, getNotes, deleteNote } = require("../controllers/noteController");

router.get("/", authMiddleware, getNotes);
router.post("/", authMiddleware, upload.single("file"), createNote);
router.delete("/:id", authMiddleware, deleteNote);

module.exports = router;
