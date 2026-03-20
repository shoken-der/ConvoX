import { SearchIcon, XCircleIcon } from "@heroicons/react/outline";
import { useState, useEffect } from "react";

export default function SearchUsers({ searchQuery, handleSearch }) {
  const [inputValue, setInputValue] = useState(searchQuery);

  // Sync internal state with external prop (e.g., when cleared from parent)
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const handleChange = (val) => {
    setInputValue(val);
    handleSearch(val);
  };

  const onClear = () => {
    handleChange("");
  };

  return (
    <div className="px-4 py-4 md:px-5 md:py-5 border-b border-slate-200/50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 sticky top-0 z-10 transition-all duration-300">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary-500/50 group-focus-within:text-primary-500 transition-colors">
          <SearchIcon className="h-4.5 w-4.5" />
        </div>
        <input
          type="text"
          className="
            block w-full pl-10 pr-10 py-2.5 text-sm rounded-2xl bg-slate-100/80 dark:bg-neutral-800/60 
            text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-500
            border-0 ring-1 ring-slate-200/50 dark:ring-neutral-700/50 focus:ring-2 focus:ring-primary-500/40 
            focus:bg-white dark:focus:bg-neutral-800 transition-all duration-300 shadow-sm
          "
          placeholder="Search people..."
          value={inputValue}
          onInput={(e) => handleChange(e.target.value)}
          autoComplete="off"
        />
        {inputValue && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 dark:text-neutral-500 hover:text-rose-500 transition-colors"
          >
            <div className="w-5 h-5 bg-slate-300 dark:bg-neutral-600 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 transition-all group/clear">
              <svg className="w-3.5 h-3.5 opacity-80 group-hover/clear:opacity-100" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
