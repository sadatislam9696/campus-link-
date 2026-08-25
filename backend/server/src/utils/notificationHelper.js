const Notification = require("../models/Notification");

// Creates a notification, but silently skips it when a user would be
// notified about their own action (e.g. liking your own post).
// Never throws - notification failures should never break the primary
// action (like/comment/friend-request) that triggered them.
const createNotification = async ({
  recipient,
  sender,
  type,
  post = undefined,
  message = "",
}) => {
  try {
    if (recipient.toString() === sender.toString()) return;

    await Notification.create({
      recipient,
      sender,
      type,
      post,
      message,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

module.exports = { createNotification };
