const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  sendRequest,
  getIncomingRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
  cancelRequest,
  removeFriend,
  getFriendsList,
  getFriendStatus,
  getSuggestions,
} = require("../controllers/friendController");

router.get("/requests", authMiddleware, getIncomingRequests);
router.get("/sent", authMiddleware, getSentRequests);
router.get("/suggestions", authMiddleware, getSuggestions);
router.get("/status/:userId", authMiddleware, getFriendStatus);
router.get("/list/:username", authMiddleware, getFriendsList);

router.post("/request/:userId", authMiddleware, sendRequest);
router.put("/accept/:requestId", authMiddleware, acceptRequest);
router.put("/reject/:requestId", authMiddleware, rejectRequest);
router.delete("/cancel/:requestId", authMiddleware, cancelRequest);
router.delete("/remove/:userId", authMiddleware, removeFriend);

module.exports = router;
