const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const Message = require("../models/Message");
const { createNotification } = require("../utils/notificationHelper");

let io;

// userId (string) -> socket.id. A user can only be counted "online" once
// even if they have this tab open twice, which keeps the online list simple.
const onlineUsers = new Map();

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Auth every socket connection with the same JWT used for REST calls.
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(" ")[1];

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit("onlineUsers", [...onlineUsers.keys()]);

    // ============================
    // Send Message
    // ============================
    socket.on("sendMessage", async ({ receiverId, text }, callback) => {
      try {
        if (!text || !text.trim()) return;

        const User = require("../models/User");
        const sender = await User.findById(socket.userId).select(
          "firstName lastName friends"
        );

        if (!sender.friends.some((id) => id.toString() === receiverId)) {
          if (typeof callback === "function") {
            callback({ success: false, message: "You can only message your friends." });
          }
          return;
        }

        const message = await Message.create({
          sender: socket.userId,
          receiver: receiverId,
          text: text.trim(),
        });

        const receiverSocketId = onlineUsers.get(receiverId);

        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newMessage", message);
        } else {
          // Receiver is offline - fall back to a regular notification so
          // they still see it next time they open the app.
          await createNotification({
            recipient: receiverId,
            sender: socket.userId,
            type: "message",
            message: `${sender.firstName} ${sender.lastName} sent you a message.`,
          });
        }

        // Echo back to the sender (and any of their other open tabs)
        // so the UI updates without waiting on a REST round-trip.
        socket.emit("newMessage", message);

        if (typeof callback === "function") {
          callback({ success: true, message });
        }
      } catch (error) {
        console.error("sendMessage socket error:", error.message);
        if (typeof callback === "function") {
          callback({ success: false, message: error.message });
        }
      }
    });

    // ============================
    // Group Chat Rooms
    // ============================
    // Clients join a room when they open a group chat's screen, so
    // "sendGroupMessage" can broadcast with io.to(room) instead of having
    // to look up every member's individual socket id.
    socket.on("joinGroupRoom", async ({ conversationId }) => {
      try {
        const GroupConversation = require("../models/GroupConversation");
        const conversation = await GroupConversation.findById(conversationId).select("members");

        if (conversation && conversation.members.some((m) => m.toString() === socket.userId)) {
          socket.join(`group:${conversationId}`);
        }
      } catch (error) {
        console.error("joinGroupRoom socket error:", error.message);
      }
    });

    socket.on("leaveGroupRoom", ({ conversationId }) => {
      socket.leave(`group:${conversationId}`);
    });

    socket.on("sendGroupMessage", async ({ conversationId, text }, callback) => {
      try {
        if (!text || !text.trim()) return;

        const GroupConversation = require("../models/GroupConversation");
        const GroupMessage = require("../models/GroupMessage");

        const conversation = await GroupConversation.findById(conversationId);

        if (!conversation || !conversation.members.some((m) => m.toString() === socket.userId)) {
          if (typeof callback === "function") {
            callback({ success: false, message: "You're not a member of this group." });
          }
          return;
        }

        const message = await GroupMessage.create({
          conversation: conversationId,
          sender: socket.userId,
          text: text.trim(),
          seenBy: [socket.userId],
        });

        conversation.updatedAt = new Date();
        await conversation.save();

        const populated = await message.populate("sender", "firstName lastName username avatar");

        io.to(`group:${conversationId}`).emit("newGroupMessage", populated);

        // Members who aren't currently in the room (app closed, on a
        // different page) still get a notification.
        const User = require("../models/User");
        const sender = await User.findById(socket.userId).select("firstName lastName");
        const room = io.sockets.adapter.rooms.get(`group:${conversationId}`);
        const activeUserIds = new Set(
          [...(room || [])].map((sockId) => {
            const s = io.sockets.sockets.get(sockId);
            return s?.userId;
          })
        );

        for (const memberId of conversation.members) {
          const memberIdStr = memberId.toString();
          if (memberIdStr === socket.userId || activeUserIds.has(memberIdStr)) continue;

          await createNotification({
            recipient: memberIdStr,
            sender: socket.userId,
            type: "message",
            message: `${sender.firstName} ${sender.lastName} sent a message in ${conversation.name}.`,
          });
        }

        if (typeof callback === "function") {
          callback({ success: true, message: populated });
        }
      } catch (error) {
        console.error("sendGroupMessage socket error:", error.message);
        if (typeof callback === "function") {
          callback({ success: false, message: error.message });
        }
      }
    });

    // ============================
    // Typing Indicator
    // ============================
    socket.on("typing", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId: socket.userId });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { senderId: socket.userId });
      }
    });

    // ============================
    // Seen Receipts
    // ============================
    socket.on("markSeen", async ({ senderId }) => {
      try {
        await Message.updateMany(
          { sender: senderId, receiver: socket.userId, seen: false },
          { $set: { seen: true } }
        );

        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("seen", { by: socket.userId });
        }
      } catch (error) {
        console.error("markSeen socket error:", error.message);
      }
    });

    // ============================
    // Disconnect
    // ============================
    socket.on("disconnect", () => {
      // Only clear the map entry if this socket is still the one on
      // record (handles rapid reconnects / multiple tabs cleanly).
      if (onlineUsers.get(socket.userId) === socket.id) {
        onlineUsers.delete(socket.userId);
        io.emit("onlineUsers", [...onlineUsers.keys()]);
      }
    });
  });

  return io;
};

const getIO = () => io;
const isUserOnline = (userId) => onlineUsers.has(userId);

// Lets REST controllers push a realtime event to one specific user
// without having direct access to their socket id.
const emitToUser = (userId, event, payload) => {
  const socketId = onlineUsers.get(userId?.toString());
  if (socketId && io) {
    io.to(socketId).emit(event, payload);
  }
};

// Lets REST controllers push a realtime event to everyone currently in a
// group chat's room, without needing direct access to each socket.
const emitToConversation = (conversationId, event, payload) => {
  if (io) {
    io.to(`group:${conversationId}`).emit(event, payload);
  }
};

module.exports = { initSocket, getIO, isUserOnline, emitToUser, emitToConversation };
