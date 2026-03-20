import { useEffect } from "react";
import { XCircleIcon } from "@heroicons/react/solid";
import { useAuth } from "../../contexts/AuthContext";

export default function ErrorMessage() {
  const { error, setError } = useAuth();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    error && (
      <div className="fixed top-6 right-6 z-[100] w-fit max-w-sm animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-3xl rounded-[1.8rem] shadow-premium border border-rose-200/50 dark:border-rose-900/40 p-0.5">
          <div className="flex items-center p-2.5 pr-4 gap-2.5 bg-rose-50/40 dark:bg-rose-500/5 rounded-[1.6rem]">
            <div className="flex-shrink-0 relative ml-0.5">
              <div className="absolute inset-0 bg-rose-500 blur-md opacity-20 animate-pulse rounded-full" />
              <XCircleIcon className="relative h-5 w-5 text-rose-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-rose-800 dark:text-rose-400 whitespace-nowrap">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
