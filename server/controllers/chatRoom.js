import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import mongoose from "mongoose";

const ensureMongoReady = (res) => {
  // readyState: 1 = connected
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: "Database unavailable. Please retry." });
    return false;
  }
  return true;
};

export const createChatRoom = async (req, res) => {
  try {
    if (!ensureMongoReady(res)) return;

    const { senderId, receiverId } = req.body;
    if (!senderId || !receiverId) {
      return res.status(400).json({ message: "senderId and receiverId are required" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ message: "Cannot create a room with yourself" });
    }

    // Check if room already exists
    const existingRoom = await ChatRoom.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingRoom) {
      return res.status(200).json(existingRoom);
    }

    const newChatRoom = new ChatRoom({
      members: [senderId, receiverId],
    });

    await newChatRoom.save();
    res.status(201).json(newChatRoom);
  } catch (error) {
    // Recovery path: in race/duplicate scenarios, fetch existing room and return it.
    try {
      const { senderId, receiverId } = req.body || {};
      if (senderId && receiverId) {
        const existingRoom = await ChatRoom.findOne({
          members: { $all: [senderId, receiverId] },
        });
        if (existingRoom) {
          return res.status(200).json(existingRoom);
        }
      }
    } catch (fallbackError) {
      console.error("createChatRoom fallback failed:", fallbackError.message);
    }

    res.status(500).json({
      message: error.message || "Failed to create chat room",
    });
  }
};

export const getChatRoomOfUser = async (req, res) => {
  try {
    if (!ensureMongoReady(res)) return;

    const userId = req.params.userId;

    // Get all rooms for the user
    const rooms = await ChatRoom.find({ members: { $in: [userId] } }).lean();

    // For each room, get last message and unread count
    const enrichedRooms = await Promise.all(
      rooms.map(async (room) => {
        const lastMessage = await ChatMessage.findOne({ chatRoomId: room._id.toString() })
          .sort({ createdAt: -1 })
          .select("message fileType fileUrl sender createdAt isDeleted")
          .lean();

        const unreadCount = await ChatMessage.countDocuments({
          chatRoomId: room._id.toString(),
          sender: { $ne: userId },
          seenBy: { $nin: [userId] },
          isDeleted: false,
        });

        return { ...room, lastMessage: lastMessage || null, unreadCount };
      })
    );

    res.status(200).json(enrichedRooms);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getChatRoomOfUsers = async (req, res) => {
  try {
    if (!ensureMongoReady(res)) return;

    const chatRoom = await ChatRoom.find({
      members: { $all: [req.params.firstUserId, req.params.secondUserId] },
    });
    res.status(200).json(chatRoom);
  } catch (error) {
    res.status(404).json({
      message: error.message,
    });
  }
};

export const deleteChatRoom = async (req, res) => {
  try {
    if (!ensureMongoReady(res)) return;

    const chatRoomId = req.params.id;

    // Delete all messages associated with this room
    await ChatMessage.deleteMany({ chatRoomId });

    // Delete the room record
    const deletedRoom = await ChatRoom.findByIdAndDelete(chatRoomId);

    if (!deletedRoom) {
      return res.status(404).json({ message: "Chat room not found" });
    }

    res.status(200).json({ message: "Chat room and all history deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
