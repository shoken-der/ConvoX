import { useState, useCallback, useEffect } from "react";
import useChat from "../../hooks/useChat";
import { getUser } from "../../services/ChatService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

import ChatRoom from "../chat/ChatRoom";
import Welcome from "../chat/Welcome";
import AllUsers from "../chat/AllUsers";
import SearchUsers from "../chat/SearchUsers";
import Header from "./Header";
import ErrorMessage from "./ErrorMessage";
import { Link } from "react-router-dom";
import { UserCircleIcon } from "@heroicons/react/outline";

export default function ChatLayout() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const { 
    users, 
    chatRooms, 
    filteredUsers, 
    filteredRooms, 
    loading, 
    searchQuery, 
    setSearchQuery,
    currentChat,
    setCurrentChat,
    onlineUsersId,
    setOnlineUsersId,
    updateChatRooms,
    hasInitiallyLoaded,
    socket,
    on,
    connected
  } = useChat();


  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Set up socket listeners
  useEffect(() => {
    const unsubGetUsers = on("getUsers", (onlineUsers) => {
      setOnlineUsersId(onlineUsers || []);
    });

    const unsubGetMessage = on("getMessage", async (data) => {
      const isInActiveChat = currentChat && data.chatRoomId === currentChat._id;
      
      if (!isInActiveChat && data.sender) {
        let senderUser = null;
        try { 
          senderUser = await getUser(data.sender); 
        } catch (err) {
          console.error("Failed to fetch sender for toast:", err);
        }
        
        addToast({
          type: "message",
          avatar: senderUser?.photoURL,
          title: senderUser?.displayName || "New Message",
          message: data.message
            ? data.message.length > 60 ? data.message.slice(0, 60) + "…" : data.message
            : data.fileType?.startsWith("image/") ? "📷 Photo" : "📎 File",
          duration: 5000,
        });
      }
    });

    return () => {
      if (unsubGetUsers) unsubGetUsers();
      if (unsubGetMessage) unsubGetMessage();
    };
  }, [on, currentChat, addToast]);

  const handleChatChange = useCallback((chat) => {
    setCurrentChat(chat);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [setCurrentChat]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleChatRoomUpsert = useCallback((room) => {
    if (!room?._id) return;
    updateChatRooms((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const withoutTempPair = safePrev.filter((r) => {
        if (!r?.isTemporary) return true;
        const sameMembers =
          Array.isArray(r.members) &&
          Array.isArray(room.members) &&
          r.members.length === room.members.length &&
          r.members.every((m) => room.members.includes(m));
        return !sameMembers;
      });
      const alreadyExists = withoutTempPair.some((r) => r._id === room._id);
      return alreadyExists ? withoutTempPair : [...withoutTempPair, room];
    });
  }, [updateChatRooms]);

  if (!hasInitiallyLoaded && loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-950 transition-colors duration-500">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 bg-primary-500 rounded-3xl blur-2xl opacity-20 animate-pulse" />
           <div className="relative w-24 h-24 bg-white dark:bg-neutral-900 rounded-2xl shadow-premium border border-slate-100 dark:border-neutral-800 flex items-center justify-center animate-in zoom-in duration-700">
              <div className="w-14 h-14 bg-gradient-to-tr from-secondary-600 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-secondary-500/30">
                <svg className="w-8 h-8 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
           </div>
        </div>
        <div className="space-y-2 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
          <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">ConvoX</h1>
          <div className="flex items-center gap-1.5 justify-center">
             <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" />
             <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]" />
             <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 dark:bg-neutral-950 transition-none animate-subtle-in">
      <Header 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      <main className="relative flex flex-1 overflow-hidden p-0 md:p-4 gap-0 md:gap-4 max-w-[1600px] w-full mx-auto self-center">
        {/* Sidebar */}
        <div
          className={`
            absolute inset-0 z-40 transform transition-all duration-500 ease-in-out md:relative md:inset-auto md:translate-x-0
            ${isSidebarOpen 
              ? "translate-x-0 w-full md:w-80 lg:w-96 opacity-100 shadow-2xl md:shadow-none" 
              : "-translate-x-full md:translate-x-0 md:w-0 md:opacity-0 md:pointer-events-none"}
            flex flex-col md:gap-4 overflow-hidden
          `}
        >
          {/* Mobile overlay */}
          {isSidebarOpen && (
            <div
              className="md:hidden absolute inset-0 bg-black/40 backdrop-blur-sm z-[-1]"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="min-w-[320px] md:min-w-[auto] flex flex-col flex-1 bg-white dark:bg-neutral-900 md:rounded-3xl shadow-premium overflow-hidden border-b md:border border-slate-200/50 dark:border-neutral-800/50">
            <SearchUsers 
              searchQuery={searchQuery} 
              handleSearch={handleSearch} 
            />
            <div className="flex-1 overflow-y-auto">
              <AllUsers
                users={searchQuery !== "" ? filteredUsers : users}
                chatRooms={searchQuery !== "" ? filteredRooms : chatRooms}
                setChatRooms={updateChatRooms}
                onlineUsersId={onlineUsersId}
                currentUser={currentUser}
                changeChat={handleChatChange}
                loading={loading}
                searchQuery={searchQuery}
              />
            </div>

            {/* Sidebar Profile Mini Card */}
            <div className="flex-shrink-0 p-3 border-t border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-900/80">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors group">
                <div className="relative flex-shrink-0">
                  <img
                    className="h-9 w-9 rounded-xl object-cover shadow-sm bg-slate-200 dark:bg-neutral-800 ring-2 ring-primary-500/0 group-hover:ring-primary-500/30 transition-all"
                    src={currentUser?.photoURL}
                    alt={currentUser?.displayName}
                    onError={(e) => {
                      e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                    }}
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {currentUser?.displayName || "You"}
                  </p>
                  <p className="text-[11px] text-emerald-500 font-medium">● Active now</p>
                </div>
                <Link
                  to="/profile"
                  title="Edit Profile"
                  className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                >
                  <UserCircleIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-neutral-900 md:rounded-3xl shadow-premium overflow-hidden md:border border-slate-200/50 dark:border-neutral-800/50 transition-all duration-500 ease-in-out">
          {currentChat ? (
            <ChatRoom
              key={currentChat._id}
              currentChat={currentChat}
              currentUser={currentUser}
              onResolveChat={setCurrentChat}
              onUpsertChatRoom={handleChatRoomUpsert}
              socket={socket}
              connected={connected}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onlineUsersId={onlineUsersId}
            />
          ) : (
            <Welcome />
          )}
        </div>
      </main>

      <ErrorMessage />
    </div>
  );
}
