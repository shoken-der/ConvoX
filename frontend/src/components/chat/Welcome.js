import { useAuth } from "../../contexts/AuthContext";

export default function Welcome() {
  const { currentUser } = useAuth();
  
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-hidden bg-slate-50 dark:bg-neutral-950 relative animate-subtle-in">
      {/* Ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary-500/5 dark:bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-md w-full space-y-10">
        {/* Animated Logo area */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          {/* Concentric animated rings */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-secondary-500/20 to-primary-500/20 animate-pulse" />
          <div className="absolute -inset-3 rounded-[2rem] border border-secondary-200/30 dark:border-secondary-500/20 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-6 rounded-[2.5rem] border border-primary-200/20 dark:border-primary-500/10 animate-[spin_14s_linear_infinite_reverse]" />
          <div className="w-24 h-24 bg-gradient-to-tr from-secondary-600 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-secondary-500/30">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome back,{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary-600 to-primary-600">
              {currentUser?.displayName?.split(" ")[0] || "there"}!
            </span>
          </h2>
          <p className="text-slate-500 dark:text-neutral-400 text-base leading-relaxed">
            Your conversations are waiting. Select a chat from the sidebar, or search for someone new to message.
          </p>
        </div>

        {/* Feature badges */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: "⚡", label: "Real-time", desc: "Instant delivery" },
            { icon: "🔒", label: "Secure", desc: "Firebase auth" },
            { icon: "🎨", label: "Rich media", desc: "Files & reactions" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-slate-100 dark:border-neutral-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <span className="text-2xl">{f.icon}</span>
              <p className="text-[11px] font-bold text-slate-700 dark:text-white">{f.label}</p>
              <p className="text-[10px] text-slate-400 dark:text-neutral-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Online indicator */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            You're online and ready to chat
          </div>
        </div>
      </div>
    </div>
  );
}
