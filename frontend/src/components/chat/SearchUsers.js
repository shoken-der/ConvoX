import { SearchIcon, XCircleIcon } from "@heroicons/react/outline";
import { useRef } from "react";

export default function SearchUsers({ searchQuery, handleSearch }) {
  const inputRef = useRef();

  const onClear = () => {
    handleSearch("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="px-4 py-4 md:px-5 md:py-5 border-b border-slate-200/50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 sticky top-0 z-10 transition-all duration-300">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary-500/50 group-focus-within:text-primary-500 transition-colors">
          <SearchIcon className="h-4.5 w-4.5" />
        </div>
        <input
          ref={inputRef}
          type="search"
          className="
            block w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl bg-slate-100 dark:bg-neutral-800/50 
            text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-500
            border-2 border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-neutral-800 
            focus:ring-0 transition-all duration-200
          "
          placeholder="Search people..."
          onInput={(e) => handleSearch(e.target.value)}
          autoComplete="off"
          defaultValue={searchQuery}
        />
        {searchQuery && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-rose-500 transition-colors"
          >
            <XCircleIcon className="h-5 w-5 fill-current opacity-60 hover:opacity-100" />
          </button>
        )}
      </div>
    </div>
  );
}
