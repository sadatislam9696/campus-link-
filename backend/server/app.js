require("dotenv").config();

const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const path = require("path");

const { generalLimiter } = require("./src/middleware/rateLimiter");
const sanitizeBody = require("./src/middleware/sanitizeBody");
const { corsOriginCheck } = require("./src/config/allowedOrigins");

const app = express();

// ===============================
// Middlewares
// ===============================
// crossOriginResourcePolicy defaults to "same-origin", which would block
// the frontend (a different origin in dev and typically in production
// too) from loading avatars/post images/note attachments served from
// /uploads. This is a JSON + file API meant to be consumed cross-origin,
// so that default doesn't fit here.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());

app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(sanitizeBody);

app.use(generalLimiter);

// ===============================
// Static Uploads
// ===============================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "src/uploads"))
);

// ===============================
// Home
// ===============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to CampusLink API",
  });
});

// ===============================
// Routes
// ===============================
app.use("/api/auth", require("./src/routes/authRoutes"));

app.use("/api/profile", require("./src/routes/profileRoutes"));

app.use("/api/posts", require("./src/routes/postRoutes"));

app.use("/api/comments", require("./src/routes/commentRoutes"));

app.use("/api/search", require("./src/routes/searchRoutes"));

app.use("/api/friends", require("./src/routes/friendRoutes"));

app.use("/api/notifications", require("./src/routes/notificationRoutes"));

app.use("/api/messages", require("./src/routes/messageRoutes"));

app.use("/api/reports", require("./src/routes/reportRoutes"));

app.use("/api/admin", require("./src/routes/adminRoutes"));

app.use("/api/groups", require("./src/routes/groupRoutes"));

app.use("/api/discussions", require("./src/routes/discussionRoutes"));

app.use("/api/events", require("./src/routes/eventRoutes"));

app.use("/api/notes", require("./src/routes/noteRoutes"));

app.use("/api/projects", require("./src/routes/projectRoutes"));

app.use("/api/assignments", require("./src/routes/assignmentRoutes"));

app.use("/api/lostfound", require("./src/routes/lostFoundRoutes"));

app.use("/api/confessions", require("./src/routes/confessionRoutes"));

app.use("/api/teams", require("./src/routes/teamRoutes"));

app.use("/api/group-chats", require("./src/routes/groupChatRoutes"));

// ===============================
// 404 + Global Error Handler
// (must be registered last, after all routes)
// ===============================
const { errorHandler, notFoundHandler } = require("./src/middleware/errorMiddleware");

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;