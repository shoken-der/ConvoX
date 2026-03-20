import { SearchIcon } from "@heroicons/react/outline";

export default function SearchUsers({ handleSearch }) {
  return (
    <div className="px-5 py-5 border-b border-slate-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-primary-500/50 group-focus-within:text-primary-500 transition-colors">
          <SearchIcon className="h-4.5 w-4.5" />
        </div>
        <input
          type="search"
          className="
            block w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl bg-slate-100 dark:bg-neutral-800/50 
            text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-neutral-500
            border-2 border-transparent focus:border-primary-500/30 focus:bg-white dark:focus:bg-neutral-800 
            focus:ring-0 transition-all duration-200
          "
          placeholder="Search people..."
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
    </div>
  );
}
