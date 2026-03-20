import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
dotenv.config();

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:3001", 
  "http://localhost:3002", 
  "http://127.0.0.1:3000", 
  "http://127.0.0.1:3002",
  "https://convo-x-sepia.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Basic logging to help debug in Render
    console.log(`CORS Check: Origin="${origin}"`);
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    const trimmedOrigin = origin.trim().replace(/\/$/, "");
    
    // Whitelist check
    const isLocal = trimmedOrigin.includes("localhost") || trimmedOrigin.includes("127.0.0.1");
    const isVercel = trimmedOrigin.endsWith(".vercel.app") || trimmedOrigin.includes("vercel.app");
    const isRender = trimmedOrigin.endsWith(".onrender.com") || trimmedOrigin.includes("onrender.com");
    const inWhitelist = allowedOrigins.includes(trimmedOrigin);

    if (isLocal || isVercel || isRender || inWhitelist || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.error(`CORS Blocked: "${origin}"`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));

// Health Check / Landing Page
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "active", 
    message: "ConvoX Server is running successfully!",
    version: "1.0.0"
  });
});

// Protect all /api routes
app.use("/api", VerifyToken);

const PORT = process.env.PORT || 8080;

app.use("/api/room", chatRoomRoutes);
app.use("/api/message", chatMessageRoutes);
app.use("/api/user", userRoutes);
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
});

const io = new Server(server, {
  cors: corsOptions,
});

io.use(VerifySocketToken);

global.onlineUsers = new Map();

const getUserIdBySocketId = (socketId) => {
  for (let [userId, sockets] of onlineUsers.entries()) {
    if (sockets.has(socketId)) return userId;
  }
  return null;
};

io.on("connection", (socket) => {
  global.chatSocket = socket;

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

