import ChatRoom from "../models/ChatRoom.js";
import ChatMessage from "../models/ChatMessage.js";
import mongoose from "mongoose";

export const createChatRoom = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;

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
    res.status(409).json({
      message: error.message,
    });
  }
};

export const getChatRoomOfUser = async (req, res) => {
  try {
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
