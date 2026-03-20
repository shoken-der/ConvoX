import { useEffect, useRef, useCallback, useState } from "react";
import io from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:3001";

export default function useSocket() {
  const socket = useRef(null);
  const [connected, setConnected] = useState(false);
  const { currentUser } = useAuth();

  const isConnecting = useRef(false);

  const connect = useCallback(async () => {
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

      s.on("disconnect", (reason) => {
        setConnected(false);
        isConnecting.current = false;
      });

      s.on("connect_error", (err) => {
        setConnected(false);
        isConnecting.current = false;
      });

      return s;
    } catch (err) {
      isConnecting.current = false;
    }
  }, [currentUser?.uid]);

  const disconnect = useCallback(() => {
    if (socket.current) {
      socket.current.disconnect();
      socket.current = null;
      setConnected(false);
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socket.current && connected) {
      socket.current.emit(event, data);
    }
  }, [connected]);

  const on = useCallback((event, callback) => {
    const currentSocket = socket.current;
    if (currentSocket) {
      currentSocket.on(event, callback);
      return () => currentSocket.off(event, callback);
    }
  }, [connected]); // Re-bind when connection status changes

  useEffect(() => {
    if (currentUser?.uid) {
      connect();
    }
    // Cleanup removal to prevent disconnect on every re-render
    // We only want to disconnect when the component unmounts globally 
    // or when the user explicitly logs out.
  }, [currentUser?.uid, connect]); 

  return { socket, connected, connect, disconnect, emit, on };
}
