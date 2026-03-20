import { useState, useEffect, useRef } from "react";
import { sendMessage, markMessageSeen, createChatRoom, getChatRoomOfUsers } from "../../services/ChatService";
import useMessages from "../../hooks/useMessages";
import Message from "./Message";
import Contact from "./Contact";
import ChatHeaderInfo from "./ChatHeaderInfo";
import ChatForm from "./ChatForm";
import { ChevronLeftIcon, ChevronRightIcon, DocumentDownloadIcon } from "@heroicons/react/outline";
import format from "date-fns/format";
import isToday from "date-fns/isToday";
import isYesterday from "date-fns/isYesterday";

// ---- Skeleton Loader ----
function MessageSkeleton({ self }) {
  return (
    <div className={`flex flex-col ${self ? "items-end" : "items-start"} mb-4 px-4`}>
      <div className={`h-12 rounded-[22px] shimmer ${self ? "w-48 bg-primary-500/10 rounded-br-[4px]" : "w-56 bg-slate-200/50 dark:bg-neutral-800/50 rounded-bl-[4px]"}`} />
    </div>
  );
}

// ---- Date Separator ----
function DateSeparator({ date }) {
  const getLabel = () => {
    const d = new Date(date);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  };

  return (
    <div className="flex justify-center my-3 mx-auto z-10 relative">
      <span className="bg-white dark:bg-[#182229] px-3 py-1.5 rounded-lg text-[11.5px] font-medium text-[#54656f] dark:text-[#8696a0] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide">
        {getLabel()}
      </span>
    </div>
  );
}

// ---- Connection Banner ----
function ConnectionBanner({ connected }) {
  if (connected) return null;
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold tracking-tight z-[100]">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
      Connecting...
    </div>
  );
}

export default function ChatRoom({ currentChat, currentUser, onResolveChat, onUpsertChatRoom, socket, onToggleSidebar, isSidebarOpen, onlineUsersId, connected }) {
  const {
    messages,
    loading,
    hasMore,
    loadMore,
    isTyping,
    updateLocalMessage,
    addLocalMessage
  } = useMessages(currentChat._id, socket, currentUser.uid, connected);

  const [replyMessage, setReplyMessage] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const scrollRef = useRef();
  const observer = useRef();
  const loadMoreObserver = useRef();

  const ensurePersistentRoom = async () => {
    if (!currentChat?.isTemporary) return currentChat;
    const receiverId = currentChat.members.find((m) => m !== currentUser.uid);
    if (!receiverId) return currentChat;

    try {
      const created = await createChatRoom({ senderId: currentUser.uid, receiverId });
      if (created?._id) {
        onUpsertChatRoom?.(created);
        onResolveChat?.(created);
        return created;
      }
    } catch (createErr) {
      try {
        const existing = await getChatRoomOfUsers(currentUser.uid, receiverId);
        const room = Array.isArray(existing) ? existing[0] : null;
        if (room?._id) {
          onUpsertChatRoom?.(room);
          onResolveChat?.(room);
          return room;
        }
      } catch (lookupErr) {
        console.error("Failed to resolve temporary room:", lookupErr);
      }
      console.error("Failed to create persistent room:", createErr);
    }

    return currentChat;
  };

  // Mark messages as seen
  const lastMessageRef = (node) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg && lastMsg.sender !== currentUser.uid && !lastMsg.seenBy?.includes(currentUser.uid)) {
          const receiverId = currentChat.members.find((m) => m !== currentUser.uid);
          await markMessageSeen(lastMsg._id, currentUser.uid);
          socket.current.emit("markSeen", {
            messageId: lastMsg._id,
            userId: currentUser.uid,
            receiverId,
          });
        }
      }
    });
    if (node) observer.current.observe(node);
  };

  // Infinite Scroll Observer (Top)
  const topRef = (node) => {
    if (loadMoreObserver.current) loadMoreObserver.current.disconnect();
    loadMoreObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore();
      }
    });
    if (node) loadMoreObserver.current.observe(node);
  };

  useEffect(() => {
    if (messages.length > 0 && !loading) {
       // Only scroll to bottom on initial load or new message
       // If we just loaded more historical messages, we shouldn't jump to the bottom
       if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ behavior: "smooth" });
       }
    }
  }, [messages.length, isTyping, loading]);

  const handleFormSubmit = async (message, fileData = null) => {
    const resolvedChat = await ensurePersistentRoom();
    const receiverId = resolvedChat.members.find((m) => m !== currentUser.uid);
    const messageBody = {
      chatRoomId: resolvedChat._id,
      sender: currentUser.uid,
      message,
      replyTo: replyMessage?._id || null,
      ...fileData,
    };
    try {
      const res = await sendMessage(messageBody);
      socket.current?.emit("sendMessage", { ...res, receiverId });
      addLocalMessage(res);
      setReplyMessage(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const renderMessages = () => {
    const items = [];
    let lastDate = null;

    messages.forEach((m, index) => {
      const msgDate = m.createdAt ? new Date(m.createdAt).toDateString() : null;
      if (msgDate && msgDate !== lastDate) {
        items.push(<DateSeparator key={`date-${msgDate}`} date={m.createdAt} />);
        lastDate = msgDate;
      }
      items.push(
        <div key={m._id || index} ref={index === messages.length - 1 ? lastMessageRef : null} className="px-4">
          <Message
            message={m}
            self={currentUser.uid}
            onReply={() => setReplyMessage(m)}
            socket={socket}
            receiverId={currentChat.members.find((mem) => mem !== currentUser.uid)}
            onMessageUpdated={updateLocalMessage}
            onImageClick={setLightboxUrl}
          />
        </div>
      );
    });
    return items;
  };

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-neutral-900 relative overflow-hidden animate-subtle-in">
      <ConnectionBanner connected={connected} />

      <div className="flex items-center gap-2 py-2 px-4 md:mx-3 md:mt-3 bg-[#f0f2f5] dark:bg-[#202c33] z-20 sticky top-0 md:top-3 md:rounded-2xl shadow-premium-sm border-b md:border border-slate-200/50 dark:border-neutral-800/50">
        <button 
          onClick={onToggleSidebar} 
          className="p-2 text-primary-500 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors flex items-center justify-center mr-1"
          title={isSidebarOpen ? "Collapse Sidebar" : "Back to Chats"}
        >
          {isSidebarOpen ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronLeftIcon className="h-6 w-6 md:h-5 md:w-5" />}
        </button>
        <div className="flex-1">
          <ChatHeaderInfo 
            chatRoom={currentChat} 
            currentUser={currentUser} 
            onlineUsersId={onlineUsersId} 
          />
        </div>
      </div>

      <div className="flex-1 relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto scroll-smooth relative">
          <div className="pt-1 pb-1 flex flex-col justify-end min-h-full">
            {/* Load More Trigger */}
            <div ref={topRef} className="h-1 w-full" />
            
            {loading && messages.length === 0 ? (
              <div className="flex flex-col gap-4">
                {[...Array(5)].map((_, i) => (<MessageSkeleton key={i} self={i % 2 === 0} />))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[60vh] gap-4 opacity-40">
                <div className="w-20 h-20 bg-white dark:bg-neutral-800 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-neutral-700">
                  <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <p className="text-sm font-bold tracking-tight text-slate-500">No messages yet.</p>
              </div>
            ) : (
              <>
                {hasMore && !loading && (
                  <div className="text-center pb-4">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scroll up to load more</span>
                  </div>
                )}
                {loading && messages.length > 0 && (
                  <div className="flex justify-center py-2 animate-pulse">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-0.5" />
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-0.5" />
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mx-0.5" />
                  </div>
                )}
                {renderMessages()}
              </>
            )}

            <div className={`px-8 transition-all duration-500 ${isTyping ? "pt-2 opacity-100 scale-100 h-12" : "pt-0 opacity-0 scale-95 h-0 overflow-hidden"}`}>
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white/50 dark:bg-neutral-800/30 backdrop-blur-md rounded-2xl rounded-bl-none w-max border border-slate-100 dark:border-neutral-700/50 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-duration:0.6s]" />
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          </div>
          <div ref={scrollRef} className="h-1" />
        </div>
        
        {lightboxUrl && (
          <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="absolute top-4 right-4 flex items-center gap-3">
              <a
                href={lightboxUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="p-2 text-white/70 hover:text-white bg-white/10 rounded-xl transition-colors"
                onClick={(e) => e.stopPropagation()}
                title="Download"
              >
                <DocumentDownloadIcon className="h-6 w-6" />
              </a>
              <button
                className="p-2 text-white/70 hover:text-white bg-white/10 rounded-xl transition-colors"
                onClick={() => setLightboxUrl(null)}
                title="Close"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <img
              src={lightboxUrl}
              alt="Full preview"
              className="max-h-[90%] max-w-full rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>

      <div className="z-30 relative md:mx-3 md:mb-3 bg-[#f0f2f5] dark:bg-[#202c33] md:rounded-2xl shadow-premium-sm border-t md:border border-slate-200/50 dark:border-neutral-800/50">
        <ChatForm
          handleFormSubmit={handleFormSubmit}
          socket={socket}
          currentChat={currentChat}
          currentUser={currentUser}
          replyMessage={replyMessage}
          setReplyMessage={setReplyMessage}
        />
      </div>
    </div>
  );
}
