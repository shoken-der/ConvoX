import React, { useState, useEffect, useMemo } from "react";
import { createChatRoom, deleteChatRoom, getChatRoomOfUsers } from "../../services/ChatService";
import Contact from "./Contact";
import UserLayout from "../layouts/UserLayout";
import { TrashIcon } from "@heroicons/react/outline";

// Skeleton placeholder for contact list loading
function ContactSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-2xl">
      <div className="h-12 w-12 rounded-xl shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 w-28 rounded-full shimmer" />
        <div className="h-2.5 w-40 rounded-full shimmer" />
      </div>
      <div className="h-2 w-8 rounded-full shimmer flex-shrink-0" />
    </div>
  );
}

export default function AllUsers({
  users,
  chatRooms,
  setChatRooms,
  onlineUsersId,
  currentUser,
  changeChat,
  loading,
  searchQuery,
}) {
  const [selectedChat, setSelectedChat] = useState();
  // Create a combined list of all users with their room info if it exists
  const allUsersWithRooms = useMemo(() => {
    if (!users) return [];
    
    // De-duplicate users by UID and filter out the current user
    const uniqueUsersMap = new Map();
    users.forEach(u => {
      if (u.uid && u.uid !== currentUser?.uid && !uniqueUsersMap.has(u.uid)) {
        uniqueUsersMap.set(u.uid, u);
      }
    });

    // Also include any users found in chatRooms that might be missing from the users list
    chatRooms?.forEach(room => {
      room.members?.forEach(memberId => {
        if (memberId !== currentUser?.uid && !uniqueUsersMap.has(memberId)) {
          // If we don't have the full user object yet, we'll use a placeholder or it will be fetched by Contact.js
          uniqueUsersMap.set(memberId, { uid: memberId, displayName: "Member", isPlaceholder: true });
        }
      });
    });

    const uniqueUsers = Array.from(uniqueUsersMap.values());
    
    const processed = uniqueUsers.map(user => {
      // Find all rooms where this user is a member
      const matchingRooms = chatRooms?.filter(r => 
        r.members?.includes(user.uid) && r.members?.includes(currentUser?.uid)
      ) || [];

      // Take the most recent room if multiple exist (to prevent duplicates)
      const room = matchingRooms.sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || 0;
        const timeB = b.lastMessage?.createdAt || 0;
        return new Date(timeB) - new Date(timeA);
      })[0];

      return {
        ...user,
        room: room
      };
    });

    // If searching, show matching users
    if (searchQuery) {
      return processed.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
    }

    // Normal view: ONLY show users with an existing chat room.
    return processed.filter(user => user.room).sort((a, b) => {
      const timeA = a.room?.lastMessage?.createdAt ? new Date(a.room.lastMessage.createdAt).getTime() : 0;
      const timeB = b.room?.lastMessage?.createdAt ? new Date(b.room.lastMessage.createdAt).getTime() : 0;

      if (timeA !== timeB) return timeB - timeA;
      return (a.displayName || "").localeCompare(b.displayName || "");
    });
  }, [users, chatRooms, currentUser?.uid, searchQuery]);

  const changeCurrentChat = (index, chat) => {
    setSelectedChat(chat._id);
    changeChat(chat);
  };

  const handleNewChatRoom = async (user) => {
    const optimisticRoomId = `temp-${currentUser.uid}-${user.uid}`;
    const optimisticRoom = {
      _id: optimisticRoomId,
      members: [currentUser.uid, user.uid],
      lastMessage: null,
      unreadCount: 0,
      isTemporary: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Open chat instantly so UI is not blocked by backend availability.
    setChatRooms((prev) => {
      const existing = prev.find(
        (room) =>
          room.members?.includes(currentUser.uid) &&
          room.members?.includes(user.uid)
      );
      if (existing) {
        changeChat(existing);
        setSelectedChat(existing._id);
        return prev;
      }
      changeChat(optimisticRoom);
      setSelectedChat(optimisticRoom._id);
      return [...prev, optimisticRoom];
    });

    try {
      const members = {
        senderId: currentUser.uid,
        receiverId: user.uid,
      };
      const res = await createChatRoom(members);
      setChatRooms((prev) => {
        const withoutTemp = prev.filter((room) => room._id !== optimisticRoomId);
        const alreadyExists = withoutTemp.some((room) => room._id === res._id);
        return alreadyExists ? withoutTemp : [...withoutTemp, res];
      });
      changeChat(res);
      setSelectedChat(res._id);
    } catch (err) {
      console.error("Failed to create chat room:", err);
      // Fallback: if room creation fails (e.g. conflict/proxy glitch), try loading existing room.
      try {
        const existingRooms = await getChatRoomOfUsers(currentUser.uid, user.uid);
        const existingRoom = Array.isArray(existingRooms) ? existingRooms[0] : null;
        if (existingRoom) {
          setChatRooms((prev) => {
            const withoutTemp = prev.filter((room) => room._id !== optimisticRoomId);
            const alreadyExists = withoutTemp.some((room) => room._id === existingRoom._id);
            return alreadyExists ? withoutTemp : [...withoutTemp, existingRoom];
          });
          changeChat(existingRoom);
          setSelectedChat(existingRoom._id);
        } else {
          // Keep optimistic room open if backend is temporarily unavailable.
          setSelectedChat(optimisticRoomId);
          changeChat(optimisticRoom);
        }
      } catch (fallbackErr) {
        console.error("Failed to load existing chat room:", fallbackErr);
        setSelectedChat(optimisticRoomId);
        changeChat(optimisticRoom);
      }
    }
  };

  const handleDeleteChatRoom = async (roomId) => {
    try {
      await deleteChatRoom(roomId);
      setChatRooms((prev) => prev.filter((r) => r._id !== roomId));
      if (selectedChat === roomId) {
        setSelectedChat(null);
        changeChat(null);
      }
    } catch (err) {
      console.error("Failed to delete chat room:", err);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-1">
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="text-xs font-semibold text-slate-500 dark:text-neutral-500 uppercase tracking-wider">
            {searchQuery ? "Search Results" : "Chats"}
          </h3>
          {!searchQuery && (
            <span className="bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-500 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {allUsersWithRooms.length}
            </span>
          )}
        </div>

        {/* Unified List */}
        <div className="space-y-1">
          {allUsersWithRooms.map((item, index) => (
            <div
              key={item.room?._id || item.uid}
              style={{ animationDelay: `${index * 30}ms` }}
              className={`
                group relative flex items-center gap-3 px-3.5 py-3 mx-2 rounded-2xl cursor-pointer transition-all duration-300 animate-subtle-in
                ${(selectedChat && (selectedChat === item.room?._id))
                  ? "bg-white dark:bg-neutral-800 shadow-premium-hover border border-slate-100 dark:border-neutral-700 scale-[1.02] z-10"
                  : "hover:bg-white/60 dark:hover:bg-neutral-800/40 border border-transparent hover:border-slate-100/50 dark:hover:border-neutral-700/30"}
              `}
              onClick={() => {
                if (item.room) {
                  setSelectedChat(item.room._id);
                  changeChat(item.room);
                } else {
                  handleNewChatRoom(item);
                }
              }}
            >
              {(selectedChat && (selectedChat === item.room?._id)) && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full shadow-[0_0_15px_rgba(20,184,166,0.5)]" />
              )}
              
              <div className="flex-1 min-w-0">
                {item.room ? (
                  <Contact
                    chatRoom={item.room}
                    user={item}
                    onlineUsersId={onlineUsersId}
                    currentUser={currentUser}
                    isSelected={selectedChat === item.room._id}
                    onDelete={() => handleDeleteChatRoom(item.room._id)}
                  />
                ) : (
                  <UserLayout
                    user={item}
                    onlineUsersId={onlineUsersId}
                  />
                )}
              </div>

              {item.room && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChatRoom(item.room._id);
                  }}
                  className={`
                    p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300 transform ml-1
                    ${(selectedChat === item.room._id) ? "opacity-100 translate-x-0" : "opacity-0 md:group-hover:opacity-100 translate-x-2 md:group-hover:translate-x-0"}
                  `}
                  title="Delete Chat"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="space-y-1 mt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ animationDelay: `${i * 100}ms` }} className="animate-pulse">
                 <ContactSkeleton />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && allUsersWithRooms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-in fade-in zoom-in duration-700">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary-500/10 dark:bg-primary-500/5 blur-2xl rounded-full" />
              <div className="relative w-16 h-16 bg-white dark:bg-neutral-900 rounded-[2rem] flex items-center justify-center shadow-premium border border-slate-100 dark:border-neutral-800">
                <svg className="w-8 h-8 text-primary-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-neutral-200 mb-2">
              {searchQuery ? "No matches found" : "Start a conversation"}
            </h4>
            <p className="text-xs text-slate-400 dark:text-neutral-500 max-w-[200px] leading-relaxed mx-auto">
              {searchQuery 
                ? `Couldn't find anyone named "${searchQuery}".` 
                : "Search for users above to start chatting with them!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
