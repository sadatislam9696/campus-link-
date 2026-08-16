const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/postUploadMiddleware");

const {
  createItem,
  getItems,
  toggleResolved,
  deleteItem,
} = require("../controllers/lostFoundController");

router.get("/", authMiddleware, getItems);
router.post("/", authMiddleware, upload.fields([{ name: "image", maxCount: 1 }]), createItem);
router.put("/:id/resolve", authMiddleware, toggleResolved);
router.delete("/:id", authMiddleware, deleteItem);

module.exports = router;
