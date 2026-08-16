require("dotenv").config();

const http = require("http");

const app = require("./app");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/socket/socket");

const PORT = process.env.PORT || 5000;

connectDB();

// Wrap the Express app in a plain http server so Socket.io can share
// the same port instead of needing a second one.
const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
