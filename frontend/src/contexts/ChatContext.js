import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import io from "socket.io-client";
import { getAllUsers, getChatRooms } from "../services/ChatService";
import { useAuth } from "./AuthContext";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || "http://localhost:3001";

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentChat, setCurrentChat] = useState(null);
  const [onlineUsersId, setOnlineUsersId] = useState([]);

  // Socket management
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const isConnecting = useRef(false);

  const connectSocket = useCallback(async () => {
    if (socket.current?.connected) return socket.current;
    if (!currentUser?.uid || isConnecting.current) return;

    try {
      isConnecting.current = true;
      const token = await currentUser.getIdToken(true);
      const s = io(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socket.current = s;

      s.on("connect", () => {
        setConnected(true);
        isConnecting.current = false;
        s.emit("addUser", currentUser.uid);
      });

      s.on("disconnect", () => {
        setConnected(false);
        isConnecting.current = false;
      });

      s.on("connect_error", () => {
        setConnected(false);
        isConnecting.current = false;
      });

      return s;
    } catch (err) {
      console.error("ChatContext - Socket connection failed:", err);
      isConnecting.current = false;
    }
  }, [currentUser?.uid]);

  const on = useCallback((event, callback) => {
    const s = socket.current;
    if (s) {
      s.on(event, callback);
      return () => s.off(event, callback);
    }
    return () => {};
  }, [connected]);

  const emit = useCallback((event, data) => {
    if (socket.current && connected) {
      socket.current.emit(event, data);
    }
  }, [connected]);

  useEffect(() => {
    if (currentUser?.uid) {
      connectSocket();
    }
    return () => {
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
        setConnected(false);
      }
    };
  }, [currentUser?.uid, connectSocket]);

  const fetchData = useCallback(async () => {
    if (!currentUser?.uid) return;
    setLoading(true);
    try {
      const [allUsers, rooms] = await Promise.all([
        getAllUsers(),
        getChatRooms(currentUser.uid)
      ]);
      setUsers(allUsers || []);
      setChatRooms(rooms || []);
      setHasInitiallyLoaded(true);
    } catch (err) {
      console.error("ChatContext - Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter(u => 
      u.displayName?.toLowerCase().includes(query) || 
      u.email?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chatRooms;
    return chatRooms.filter(room => {
      const otherMembers = room.members?.filter(m => m !== currentUser?.uid) || [];
      return otherMembers.some(memberId => {
        const userMatch = users.find(u => u.uid === memberId);
        return (
          userMatch?.displayName?.toLowerCase().includes(query) ||
          userMatch?.email?.toLowerCase().includes(query)
        );
      });
    });
  }, [chatRooms, users, searchQuery, currentUser?.uid]);

  const updateChatRooms = useCallback((newRooms) => {
    setChatRooms(newRooms);
  }, []);

  const value = {
    users,
    chatRooms,
    filteredUsers,
    filteredRooms,
    loading,
    hasInitiallyLoaded,
    searchQuery,
    setSearchQuery,
    currentChat,
    setCurrentChat,
    onlineUsersId,
    setOnlineUsersId,
    updateChatRooms,
    refresh: fetchData,
    socket,
    connected,
    on,
    emit
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChatContext must be used within a ChatProvider");
  return context;
};
