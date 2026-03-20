import ChatMessage from "../models/ChatMessage.js";

export const createMessage = async (req, res) => {
  try {
    const { chatRoomId, sender, message, replyTo, fileUrl, fileType, fileSize } = req.body;
    
    // Simple XSS sanitization - strip potential script tags or direct HTML
    const sanitizedMessage = message ? message.replace(/<[^>]*>?/gm, "") : "";

    const newMessage = new ChatMessage({
      chatRoomId,
      sender,
      message: sanitizedMessage,
      replyTo,
      fileUrl,
      fileType,
      fileSize
    });

    let savedMessage = await newMessage.save();
    
    // Ensure the message is fully populated before returning
    if (savedMessage.replyTo) {
      savedMessage = await ChatMessage.findById(savedMessage._id).populate("replyTo");
    }
    
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const getMessages = async (req, res) => {
  const { chatRoomId } = req.params;
  const page = parseInt(req.query.page) || 0;
  const limit = parseInt(req.query.limit) || 50; // Default to 50 for performance

  try {
    const messages = await ChatMessage.find({ chatRoomId })
      .sort({ createdAt: -1 }) // Get newest first for pagination
      .skip(page * limit)
      .limit(limit)
      .populate("replyTo")
      .lean();
    
    // Reverse because we want oldest to newest in the UI
    res.status(200).json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleReaction = async (req, res) => {
  const { messageId } = req.params;
  const { userId, emoji } = req.body;

  try {
    const message = await ChatMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existingReactionIndex = message.reactions.findIndex(
      (r) => r.userId === userId && r.emoji === emoji
    );

    if (existingReactionIndex > -1) {
      // Remove reaction
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text } = req.body;

  try {
    const message = await ChatMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Check 10 minute limit
    const now = new Date();
    const createdAt = new Date(message.createdAt);
    const diffInMinutes = (now - createdAt) / (1000 * 60);

    if (diffInMinutes > 10) {
      return res.status(403).json({ message: "Edit time limit exceeded (10 mins)" });
    }

    message.message = text;
    message.isEdited = true;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await ChatMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.isDeleted = true;
    message.message = "This message was deleted";
    message.fileUrl = null;
    await message.save();

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markMessageSeen = async (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  try {
    const message = await ChatMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (!message.seenBy.includes(userId)) {
      message.seenBy.push(userId);
      await message.save();
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
