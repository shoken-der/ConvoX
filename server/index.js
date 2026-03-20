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

const app = express();

// Trust proxy for Render/Vercel (important for CORS/cookies)
app.set('trust proxy', 1);

// MANUAL CORS MIDDLEWARE - EXPLICIT & RELIABLE
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // LOG EVERYTHING for Senior Debugging
  console.log(`[V1.0.4 DEBUG] ${req.method} ${req.url}`);
  console.log(`[V1.0.4 DEBUG] Origin: ${origin}`);

  if (origin) {
    // Reflect the origin back - this is the most reliable way for multiple subdomains
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Handle Preflight (OPTIONS) - Respond immediately with 200
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
    message: "ConvoX Server - VERSION 1.0.4 - MANUAL CORS",
    node_env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

// IMPORTANT: User routes are NOT protected by VerifyToken for now to ensure they load
app.use("/api/user", userRoutes);

// Protect all OTHER /api routes
app.use("/api", VerifyToken);

const PORT = process.env.PORT || 8080;

app.use("/api/room", chatRoomRoutes);
app.use("/api/message", chatMessageRoutes);
app.use("/api/upload", uploadRoutes);

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
  console.log(`Server v1.0.4 is running on port ${PORT}`);
});

const onlineUsers = new Map();

const getUserIdBySocketId = (socketId) => {
  for (let [userId, sockets] of onlineUsers.entries()) {
    if (sockets.has(socketId)) return userId;
  }
  return null;
};

// Update Socket.io CORS to reflect origin as well
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
    
    // Broadcast online user list to EVERYONE
    const onlineUserIds = Array.from(onlineUsers.keys());
    io.emit("getUsers", onlineUserIds);
  });

  socket.on("sendMessage", (data) => {
    const { receiverId, chatRoomId } = data;
    
    broadcastToUser(receiverId, "getMessage", data);
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    broadcastToUser(receiverId, "typing", { senderId });
  });

  socket.on("reaction", ({ senderId, receiverId, messageId, emoji, reactions }) => {
    broadcastToUser(receiverId, "getReaction", {
      senderId,
      messageId,
      emoji,
      reactions,
    });
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
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
      }
    }
    io.emit("getUsers", Array.from(onlineUsers.keys()));
  });
});
