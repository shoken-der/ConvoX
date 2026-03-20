export default function TextArea({
  className = "",
  ...props
}) {
  return (
    <textarea
      className={`block w-full px-4 py-3 text-sm rounded-2xl bg-slate-50 dark:bg-neutral-800/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-neutral-600 border-2 border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-neutral-800 focus:ring-0 transition-all duration-200 outline-none resize-none ${className}`}
      {...props}
    />
  );
}

