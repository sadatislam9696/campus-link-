const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const {
  getStats,
  getUsers,
  toggleBanUser,
  deleteUser,
  getPosts,
  deletePostAsAdmin,
  getReports,
  resolveReport,
} = require("../controllers/adminController");

// Every route below requires a valid, logged-in admin.
router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStats);

router.get("/users", getUsers);
router.put("/users/:id/ban", toggleBanUser);
router.delete("/users/:id", deleteUser);

router.get("/posts", getPosts);
router.delete("/posts/:id", deletePostAsAdmin);

router.get("/reports", getReports);
router.put("/reports/:id/resolve", resolveReport);

module.exports = router;
