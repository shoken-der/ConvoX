import { useState, useEffect, useCallback, useRef } from "react";
import { getMessagesOfChatRoom } from "../services/ChatService";

export default function useMessages(currentChatId, socket, currentUserUid, connected) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const LIMIT = 50;

  const fetchMessages = useCallback(async (pageNum = 0) => {
    if (!currentChatId) return;
    if (pageNum === 0) setLoading(true);
    
    try {
      const res = await getMessagesOfChatRoom(currentChatId, pageNum, LIMIT);
      if (res.length < LIMIT) setHasMore(false);
      
      setMessages(prev => pageNum === 0 ? res : [...res, ...prev]);
      setPage(pageNum);
    } catch (err) {
    } finally {
      if (pageNum === 0) setLoading(false);
    }
  }, [currentChatId]);

  useEffect(() => {
    setMessages([]);
    setHasMore(true);
    setPage(0);
    fetchMessages(0);
  }, [currentChatId, fetchMessages]);

  // Real-time listeners
  useEffect(() => {
    if (!socket?.current || !currentChatId) return;
    const s = socket.current;

    const handleNewMessage = (data) => {
      if (data.chatRoomId === currentChatId) {
        setMessages(prev => [...prev, data]);
      }
    };

    const handleReaction = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId ? { ...m, reactions: data.reactions } : m
      ));
    };

    const handleEdit = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId ? { ...m, message: data.message, isEdited: true, ...data.updatedMessage } : m
      ));
    };

    const handleDelete = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId ? { ...m, isDeleted: true, message: "This message was deleted", fileUrl: null } : m
      ));
    };

    const handleSeen = (data) => {
      setMessages(prev => prev.map(m => 
        m._id === data.messageId ? { ...m, seenBy: [...new Set([...(m.seenBy || []), data.userId])] } : m
      ));
    };

    const handleTyping = (data) => {
      if (data.senderId !== currentUserUid) setIsTyping(true);
    };

    const handleStopTyping = () => setIsTyping(false);

    s.on("getMessage", handleNewMessage);
    s.on("getReaction", handleReaction);
    s.on("messageEdited", handleEdit);
    s.on("messageDeleted", handleDelete);
    s.on("messageSeen", handleSeen);
    s.on("typing", handleTyping);
    s.on("stopTyping", handleStopTyping);

    return () => {
      s.off("getMessage", handleNewMessage);
      s.off("getReaction", handleReaction);
      s.off("messageEdited", handleEdit);
      s.off("messageDeleted", handleDelete);
      s.off("messageSeen", handleSeen);
      s.off("typing", handleTyping);
      s.off("stopTyping", handleStopTyping);
    };
  }, [socket, currentChatId, currentUserUid, connected]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMessages(page + 1);
    }
  };

  const updateLocalMessage = useCallback((updatedMsg) => {
    setMessages(prev => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
  }, []);

  const addLocalMessage = useCallback((newMsg) => {
    setMessages(prev => [...prev, newMsg]);
  }, []);

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    isTyping,
    updateLocalMessage,
    addLocalMessage
  };
}
