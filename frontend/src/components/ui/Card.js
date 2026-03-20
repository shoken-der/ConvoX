export default function Card({ className = "", children, ...props }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200/70 dark:border-neutral-800/70 bg-white/85 dark:bg-neutral-900/35 backdrop-blur-md shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

