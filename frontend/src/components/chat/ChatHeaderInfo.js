import { useMemo } from "react";
import useChat from "../../hooks/useChat";
import { format } from "timeago.js";

export default function ChatHeaderInfo({ chatRoom, onlineUsersId, currentUser }) {
  const { users } = useChat();

  const contact = useMemo(() => {
    const contactId = chatRoom?.members?.find((m) => m !== currentUser?.uid);
    if (!contactId) return {};
    
    // Direct lookup from pre-loaded global users list
    return users.find(u => u.uid === contactId) || { uid: contactId, displayName: "Member" };
  }, [chatRoom, currentUser?.uid, users]);

  const isOnline = onlineUsersId?.includes(contact.uid);
  const lastMessage = chatRoom?.lastMessage;

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <img
          className="h-10 w-10 rounded-xl object-cover ring-2 ring-white/10 dark:ring-neutral-900/50 shadow-premium-sm"
          src={contact.photoURL || `https://ui-avatars.com/api/?name=${contact.displayName}&background=random`}
          alt={contact.displayName}
          onError={(e) => {
            e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
          }}
        />
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[2px] border-white dark:border-neutral-900 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-normal text-[#111b21] dark:text-[#e9edef] truncate tracking-tight mb-0.5">
          {contact.displayName}
        </h4>
        <div className="flex items-center gap-1.5">
          {isOnline ? (
            <span className="text-[13px] text-[#667781] dark:text-[#8696a0] tracking-wide animate-in fade-in slide-in-from-bottom-1 duration-500">
              online
            </span>
          ) : (
             <span className="text-[13px] text-[#667781] dark:text-[#8696a0] tracking-tight">offline</span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0 pr-2">
         {!isOnline && lastMessage?.createdAt && (
           <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 whitespace-nowrap opacity-80 uppercase tracking-widest tabular-nums animate-in fade-in slide-in-from-right-2 duration-700">
             {format(lastMessage.createdAt).toUpperCase()}
           </span>
         )}
      </div>
    </div>
  );
}
