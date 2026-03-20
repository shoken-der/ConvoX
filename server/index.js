import "dotenv/config";
import express from "express";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";

import "./config/mongo.js";

import { VerifyToken, VerifySocketToken } from "./middlewares/VerifyToken.js";
import chatRoomRoutes from "./routes/chatRoom.js";
import chatMessageRoutes from "./routes/chatMessage.js";
import userRoutes from "./routes/user.js";
import uploadRoutes from "./routes/upload.js";
import { getAllUsers } from "./controllers/user.js";

const app = express();

// Trust proxy for Render/Vercel
app.set('trust proxy', 1);

// AGGRESSIVE MANUAL CORS - VERSION 1.0.5
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  
  // LOG EVERYTHING for Senior Debugging
  console.log(`[V1.0.5 DEBUG] ${req.method} ${req.url} | Origin: ${origin}`);

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24h

  // Handle Preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health Check / Landing Page
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "active", 
    message: "ConvoX Server - VERSION 1.0.5 - AGGRESSIVE CORS",
    node_env: process.env.NODE_ENV,
    origin_seen: req.headers.origin || "none"
  });
});

// DIRECT MOUNTING to bypass any router issues
// This ensures /api/user is definitely reachable
app.get("/api/user", getAllUsers);

// Protect other /api routes
app.use("/api", VerifyToken);

const PORT = process.env.PORT || 8080;

app.use("/api/room", chatRoomRoutes);
app.use("/api/message", chatMessageRoutes);
app.use("/api/upload", uploadRoutes);
// We still mount userRoutes for other methods if needed
app.use("/api/user", userRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve Static Files in Production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

const server = app.listen(PORT, () => {
  console.log(`Server v1.0.5 is running on port ${PORT}`);
});

const onlineUsers = new Map();

const getUserIdBySocketId = (socketId) => {
  for (let [userId, sockets] of onlineUsers.entries()) {
    if (sockets.has(socketId)) return userId;
  }
  return null;
};

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, origin || true),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  },
});

io.use(VerifySocketToken);

io.on("connection", (socket) => {
  console.log(`[SOCKET] User connected: ${socket.id}`);

  const broadcastToUser = (userId, event, data) => {
    const receiverSockets = onlineUsers.get(userId);
    if (receiverSockets && receiverSockets.size > 0) {
      receiverSockets.forEach(id => {
        io.to(id).emit(event, data);
      });
      return true;
    }
    return false;
  };

  socket.on("addUser", (userId) => {
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit("getUsers", onlineUserIds);
  });

  socket.on("sendMessage", (data) => {
    broadcastToUser(data.receiverId, "getMessage", data);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    broadcastToUser(receiverId, "typing", { senderId });
  });

  socket.on("reaction", (data) => {
    broadcastToUser(data.receiverId, "getReaction", data);
  });

  socket.on("editMessage", (data) => {
    broadcastToUser(data.receiverId, "messageEdited", data);
  });

  socket.on("deleteMessage", (data) => {
    broadcastToUser(data.receiverId, "messageDeleted", data);
  });

  socket.on("markSeen", (data) => {
    broadcastToUser(data.receiverId, "messageSeen", data);
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    broadcastToUser(receiverId, "stopTyping", { senderId });
  });

  socket.on("disconnect", () => {
    const userId = getUserIdBySocketId(socket.id);
    if (userId) {
      const userSockets = onlineUsers.get(userId);
      userSockets.delete(socket.id);
      if (userSockets.size === 0) onlineUsers.delete(userId);
    }
    io.emit("getUsers", Array.from(onlineUsers.keys()));
  });
});
