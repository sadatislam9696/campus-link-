const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { search } = require("../controllers/searchController");

// GET /api/search?q=keyword
router.get("/", authMiddleware, search);

module.exports = router;
