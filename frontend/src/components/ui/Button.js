export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled,
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500/40";

  const sizes = {
    sm: "text-xs px-3 py-2 rounded-xl",
    md: "text-sm px-4 py-2.5 rounded-xl",
    lg: "text-sm px-5 py-3 rounded-2xl",
  };

  const variants = {
    primary:
      "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20",
    secondary:
      "bg-secondary-600 hover:bg-secondary-500 text-white shadow-lg shadow-secondary-500/20",
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-neutral-100 border border-slate-200/60 dark:border-neutral-700/60",
    danger:
      "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20",
  };

  return (
    <button
      type={type}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}

