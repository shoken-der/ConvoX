import express from "express";

import { 
  createMessage, 
  getMessages, 
  toggleReaction,
  editMessage,
  deleteMessage,
  markMessageSeen
} from "../controllers/chatMessage.js";

const router = express.Router();

router.post("/", createMessage);
router.get("/:chatRoomId", getMessages);
router.post("/:messageId/react", toggleReaction);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);
router.patch("/:messageId/seen", markMessageSeen);

export default router;
