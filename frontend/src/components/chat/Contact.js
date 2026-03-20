import { useState, useEffect } from "react";
import { getUser } from "../../services/ChatService";
import { format } from "timeago.js";
import { TrashIcon } from "@heroicons/react/outline";

export default function Contact({ chatRoom, onlineUsersId, currentUser, isSelected, onDelete, user }) {
  const [contact, setContact] = useState(user || {});

  useEffect(() => {
    if (user && Object.keys(user).length > 0) {
      setContact(user);
      return;
    }

    const contactId = chatRoom?.members?.find((m) => m !== currentUser?.uid);
    if (!contactId) return;

    const fetchData = async () => {
      const res = await getUser(contactId);
      if (res) setContact(res);
    };
    fetchData();
  }, [chatRoom, currentUser?.uid, user]);

  const isOnline = onlineUsersId?.includes(contact.uid);

  return (
    <div className="flex items-center gap-3 w-full group/contact">
      <div className="relative flex-shrink-0">
        <div className={`transition-all duration-300 ${isSelected ? "p-1 rounded-[20px] bg-primary-500/10" : "p-0"}`}>
          <img
            className={`h-12 w-12 rounded-[18px] object-cover ring-2 ring-white/10 dark:ring-neutral-900/50 shadow-premium-sm transition-transform duration-500 group-hover/contact:scale-110 ${isSelected ? "scale-105" : ""}`}
            src={contact.photoURL || `https://ui-avatars.com/api/?name=${contact.displayName}&background=random`}
            alt={contact.displayName}
            onError={(e) => {
              e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
            }}
          />
        </div>
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-[3px] border-white dark:border-neutral-900 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse z-10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <div className="flex items-center gap-2 min-w-0 flex-1">
             <h4 className={`text-[13.5px] font-bold truncate tracking-tight transition-colors ${isSelected ? "text-primary-600 dark:text-primary-400" : "text-slate-900 dark:text-neutral-100"}`}>
              {contact.displayName}
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
