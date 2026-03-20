export default function UserLayout({ user, onlineUsersId }) {
  const isOnline = onlineUsersId?.includes(user?.uid);

  return (
    <div className="flex items-center gap-3 w-full group/user">
      <div className="relative flex-shrink-0">
        <img
          className="h-12 w-12 rounded-[18px] object-cover ring-2 ring-white/10 dark:ring-neutral-900/50 shadow-premium-sm transition-transform duration-500 group-hover/user:scale-110"
          src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName}&background=random`}
          alt={user?.displayName}
          onError={(e) => {
            e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
          }}
        />
        {isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-[3px] border-white dark:border-neutral-900 bg-emerald-500 shadow-sm animate-pulse z-10" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[14.5px] font-bold text-slate-800 dark:text-neutral-100 transition-colors group-hover/user:text-primary-600 truncate tracking-tight">
          {user?.displayName}
        </h4>
      </div>
    </div>
  );
}
