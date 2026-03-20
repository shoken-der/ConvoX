import { forwardRef } from "react";

const sizeMap = {
  sm: "p-2 text-xs rounded-xl",
  md: "p-2.5 text-sm rounded-xl",
  lg: "p-3 text-sm rounded-2xl",
};

export const IconButton = forwardRef(function IconButton(
  { size = "md", variant = "ghost", className = "", disabled, ...props },
  ref
) {
  const variants = {
    ghost:
      "bg-transparent hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-100 border border-slate-200/60 dark:border-neutral-700/60",
    primary: "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-500/20",
    danger: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20",
  };

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary-500/40 ${sizeMap[size] || sizeMap.md} ${variants[variant] || variants.ghost} ${className}`}
      {...props}
    />
  );
});

