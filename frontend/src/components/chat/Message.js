import { useState, useRef, useEffect, useMemo, memo } from "react";
import { format } from "timeago.js";
import {
  EmojiHappyIcon as EmojiHappyOutline,
  DocumentDownloadIcon,
  DocumentIcon,
  ReplyIcon,
  TrashIcon,
} from "@heroicons/react/outline";
import { EmojiHappyIcon as EmojiHappySolid, CheckIcon } from "@heroicons/react/solid";
import { toggleReaction, deleteMessage, editMessage } from "../../services/ChatService";

const Message = memo(({ message, self, onReply, socket, receiverId, onMessageUpdated, onImageClick }) => {
  const isSelf = self === message.sender;
  const [showReactions, setShowReactions] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.message || "");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const editInputRef = useRef();

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing]);

  // Check if edit is still allowed (10 min window)
  const isEditAllowed = () => {
    if (!message.createdAt) return false;
    const diffMs = Date.now() - new Date(message.createdAt).getTime();
    return diffMs < 10 * 60 * 1000;
  };

  const handleReaction = async (emoji) => {
    try {
      const res = await toggleReaction(message._id, { userId: self, emoji });
      if (res && res.reactions) {
        onMessageUpdated && onMessageUpdated({ ...res });
        socket.current.emit("reaction", {
          senderId: self,
          receiverId,
          messageId: message._id,
          emoji,
          reactions: res.reactions,
        });
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await deleteMessage(message._id);
      onMessageUpdated && onMessageUpdated(res);
      socket.current.emit("deleteMessage", {
        messageId: message._id,
        receiverId,
        updatedMessage: res,
      });
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || editText === message.message) {
      setIsEditing(false);
      return;
    }
    setIsSubmittingEdit(true);
    try {
      const res = await editMessage(message._id, editText.trim());
      onMessageUpdated && onMessageUpdated(res);
      socket.current.emit("editMessage", {
        messageId: message._id,
        message: res.message,
        receiverId,
        updatedMessage: res,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Edit error:", err);
    }
    setIsSubmittingEdit(false);
  };



  const getNameColor = (senderId) => {
    const colors = ["text-emerald-500", "text-blue-500", "text-amber-500", "text-rose-500", "text-secondary-500"];
    const index = parseInt(senderId?.substring(0, 2) || "0", 16) % colors.length;
    return colors[isNaN(index) ? 0 : index];
  };

  // Emoji reaction grouping - Memoized for performance
  const groupedReactions = useMemo(() => {
    return message.reactions?.reduce((acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = [];
      acc[r.emoji].push(r.userId);
      return acc;
    }, {}) || {};
  }, [message.reactions]);

  const renderFile = () => {
    if (!message.fileUrl || message.isDeleted) return null;

    if (message.fileType?.startsWith("image/")) {
      return (
        <div
          className="mt-2 mb-1 rounded-xl overflow-hidden shadow-premium-sm border border-slate-200/50 dark:border-neutral-700/50 group/file cursor-pointer"
          onClick={() => onImageClick && onImageClick(message.fileUrl)}
        >
          <img
            src={message.fileUrl}
            alt="Shared media"
            className="max-h-72 w-full object-cover hover:scale-105 transition-transform duration-500"
          />
        </div>
      );
    }

    if (message.fileType?.startsWith("video/")) {
      return (
        <div className="mt-2 mb-1 rounded-xl overflow-hidden shadow-premium-sm">
          <video controls className="w-full max-h-72">
            <source src={message.fileUrl} type={message.fileType} />
          </video>
        </div>
      );
    }

    return (
      <div
        className={`mt-2 mb-1 flex items-center gap-3 p-3 rounded-xl border ${
          isSelf ? "bg-white/10 border-white/20" : "bg-slate-50 dark:bg-neutral-900 border-slate-100 dark:border-neutral-800"
        }`}
      >
        <div className="p-2 bg-primary-500/10 rounded-lg">
          <DocumentIcon className="h-6 w-6 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">File Attachment</p>
          {message.fileSize && (
            <p className="text-[10px] opacity-60">{(message.fileSize / 1024 / 1024).toFixed(2)} MB</p>
          )}
        </div>
        <a
          href={message.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <DocumentDownloadIcon className="h-5 w-5" />
        </a>
      </div>
    );
  };

  return (
    <div className={`p-1 flex flex-col ${isSelf ? "items-end" : "items-start"} mb-[2px] animate-subtle-in`}>
      <div className="flex items-end gap-2 max-w-[88%] md:max-w-[80%] relative group/msg">
        {/* Bubble */}
        <div
          className={`
            relative px-2.5 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition-all duration-300 cursor-pointer md:cursor-default
            ${
              isSelf
                ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-md rounded-tr-none"
                : "bg-[#ffffff] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-md rounded-tl-none"
            }
            ${message.isDeleted ? "opacity-50 italic text-[12px]" : ""}
          `}
          onClick={() => {
            if (window.innerWidth < 768 && !message.isDeleted) {
              setShowMobileActions(!showMobileActions);
            }
          }}
        >
          {/* Hover Actions - Horizontal Row at TOP with Conditional Visibility */}
          {!message.isDeleted && (
            <div
              className={`
                absolute top-1 transition-all duration-200 z-40 flex flex-row items-center gap-1.5
                ${showMobileActions ? "opacity-100 visible" : "opacity-0 invisible md:group-hover/msg:opacity-100 md:group-hover/msg:visible"}
                ${isSelf ? "right-full mr-2" : "left-full ml-2"}
              `}
            >
              {isSelf ? (
                <>
                  {/* Sender Order: Delete -> Reply -> Reaction */}
                  <button 
                    onClick={handleDelete} 
                    title="Delete" 
                    className="p-1.5 rounded-full bg-white/10 dark:bg-neutral-800/80 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-500 dark:text-[#8696a0] hover:text-rose-500 transition-colors border border-transparent shadow-sm"
                  >
                    <TrashIcon className="h-[18px] w-[18px]" />
                  </button>

                  <button 
                    onClick={onReply} 
                    title="Reply" 
                    className="p-1.5 rounded-full bg-white/10 dark:bg-neutral-800/80 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500 dark:text-[#8696a0] transition-colors border border-transparent shadow-sm"
                  >
                    <ReplyIcon className="h-[18px] w-[18px]" />
                  </button>

                  <div className="relative group/re">
                    <button 
                      onClick={() => setShowReactions(!showReactions)} 
                      title="React" 
                      className={`p-1.5 rounded-full transition-all border border-transparent shadow-sm ${showReactions ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 scale-110" : "bg-white/10 dark:bg-neutral-800/80 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500 dark:text-[#8696a0]"}`}
                    >
                      <EmojiHappyOutline className="h-5 w-5" />
                    </button>
                    {showReactions && (
                      <div className={`absolute bottom-full mb-2 right-0 flex items-center gap-1 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-slate-200/50 dark:border-[#222d34] z-[60] animate-in zoom-in-75 slide-in-from-bottom-2`}>
                        {["❤️", "👍", "🔥", "😂", "😮", "😢"].map((emoji) => (
                          <button key={emoji} onClick={() => handleReaction(emoji)} className="hover:scale-125 hover:-translate-y-1 transition-all p-1.5 text-lg active:scale-90">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Receiver Order: Reaction -> Reply */}
                  <div className="relative group/re">
                    <button 
                      onClick={() => setShowReactions(!showReactions)} 
                      title="React" 
                      className={`p-1.5 rounded-full transition-all border border-transparent shadow-sm ${showReactions ? "bg-amber-100 dark:bg-amber-900/40 text-amber-600 scale-110" : "bg-white/10 dark:bg-neutral-800/80 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500 dark:text-[#8696a0]"}`}
                    >
                      <EmojiHappyOutline className="h-5 w-5" />
                    </button>
                    {showReactions && (
                      <div className={`absolute bottom-full mb-2 left-0 flex items-center gap-1 bg-white/95 dark:bg-[#202c33]/95 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-slate-200/50 dark:border-[#222d34] z-[60] animate-in zoom-in-75 slide-in-from-bottom-2`}>
                        {["❤️", "👍", "🔥", "😂", "😮", "😢"].map((emoji) => (
                          <button key={emoji} onClick={() => handleReaction(emoji)} className="hover:scale-125 hover:-translate-y-1 transition-all p-1.5 text-lg active:scale-90">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={onReply} 
                    title="Reply" 
                    className="p-1.5 rounded-full bg-white/10 dark:bg-neutral-800/80 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-500 dark:text-[#8696a0] transition-colors border border-transparent shadow-sm"
                  >
                    <ReplyIcon className="h-[18px] w-[18px]" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Reply Context - cleaner look */}
          {message.replyTo && !message.isDeleted && (
            <div className={`mb-1 p-2 rounded-md text-[13px] border-l-[4px] relative overflow-hidden ${
                isSelf ? "bg-[#cbf4c6] dark:bg-[#025042] border-[#25d366]" : "bg-[#f0f2f5] dark:bg-[#111b21] border-[#31a24c]"
              }`}
            >
              <span className={`font-semibold block text-[13px] mb-0.5 ${isSelf ? "text-[#025042] dark:text-[#25d366]" : "text-[#31a24c] dark:text-[#31a24c]"}`}>
                {message.replyTo.sender === self ? "You" : "Reply"}
              </span>
              <p className="truncate opacity-80 italic">
                {message.replyTo.message || "Media Attachment"}
              </p>
            </div>
          )}

          {/* Media */}
          {renderFile()}

          {/* Message Text / Edit Input */}
          {isEditing ? (
            <div className="space-y-2 min-w-[200px] py-1">
              <textarea
                ref={editInputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                  if (e.key === "Escape") setIsEditing(false);
                }}
                className="block w-full bg-white/10 text-white placeholder-white/40 border border-white/20 rounded-xl px-3 py-2 text-[12.5px] resize-none focus:outline-none focus:ring-1 focus:ring-white/30"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold px-3 py-1 transparent hover:underline text-white">Cancel</button>
                <button onClick={handleEditSubmit} disabled={isSubmittingEdit} className="text-[10px] font-extrabold px-3 py-1 bg-white text-primary-600 rounded-lg shadow-sm hover:scale-105 transition-transform active:scale-95">SAVE</button>
              </div>
            </div>
          ) : (
            message.message && (
              <span className={`block text-[14.2px] leading-[19px] break-words text-[#111b21] dark:text-[#e9edef] ${message.isDeleted ? "text-opacity-60 italic" : ""}`}>
                {message.message}
              </span>
            )
          )}

          {/* Meta Info: Time + Edit Label + Status */}
          <div className="flex items-center justify-end gap-1 mt-0.5 select-none float-right ml-3 text-[#667781] dark:text-[#8696a0]">
            {message.isEdited && !message.isDeleted && (
              <span className="text-[10px] italic mr-1">Edited</span>
            )}
            <span className="text-[10px] tabular-nums leading-none">
              {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {isSelf && !message.isDeleted && (
              <div className={`flex items-center transition-all ml-0.5 ${message.seenBy?.length > 0 ? "text-[#53bdeb]" : ""}`}>
                <CheckIcon className="h-3 w-3" />
                {message.seenBy?.length > 0 && <CheckIcon className="-ml-2 h-3 w-3" />}
              </div>
            )}
          </div>



          {/* Reaction Pills - Miniature Version */}
          {Object.keys(groupedReactions).length > 0 && !message.isDeleted && (
            <div className={`absolute -bottom-2.5 flex items-center gap-0.5 bg-white/95 dark:bg-neutral-900 border border-slate-200/50 dark:border-neutral-800 rounded-full px-1.5 py-0.5 shadow-lg transition-all hover:scale-110 z-10 ${isSelf ? "right-1" : "left-1"}`}>
              {Object.entries(groupedReactions).map(([emoji, users]) => (
                <div key={emoji} className="flex items-center gap-0.5 px-0.5">
                  <span className="text-[11px] scale-90">{emoji}</span>
                  {users.length > 1 && <span className="text-[9px] font-black text-slate-500">{users.length}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

Message.displayName = "Message";
export default Message;
