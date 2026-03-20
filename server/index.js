import "dotenv/config";
import express from "express";
import cors from "cors";
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

const defaultAllowedOrigins = [
  "https://convo-x-sepia.vercel.app",
  "https://convox-sepia.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const mergedAllowedOrigins = Array.from(
  new Set([...defaultAllowedOrigins, ...allowedOrigins])
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (mergedAllowedOrigins.includes(origin)) return true;
  // Allow Vercel preview/production domains safely (https only)
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  credentials: true,
  maxAge: 86400,
};

app.use((req, _res, next) => {
  console.log(`[V1.0.6 DEBUG] ${req.method} ${req.url} | Origin: ${req.headers.origin || "none"}`);
  next();
});
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health Check / Landing Page
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "active", 
    message: "ConvoX Server - VERSION 1.0.6 - STABLE CORS",
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
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
    },
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
