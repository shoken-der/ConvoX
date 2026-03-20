import { LogoutIcon, UserCircleIcon, MenuIcon, ChatIcon, SearchIcon, XIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Logout from "../accounts/Logout";
import useChat from "../../hooks/useChat";

export default function Header({ isSidebarOpen, toggleSidebar }) {
  const [modal, setModal] = useState(false);
  const { currentUser, logout } = useAuth();
  const { setCurrentChat } = useChat();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <>
      <header className="px-4 py-3 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md border-b border-slate-200/50 dark:border-neutral-800/50 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center gap-2 group"
              onClick={() => setCurrentChat(null)}
            >
              <div className="w-10 h-10 bg-gradient-to-tr from-secondary-600 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200 shadow-secondary-500/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-950 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">
                ConvoX
              </span>
            </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser && (
              <>
                <button
                  onClick={toggleSidebar}
                  className={`md:hidden p-2 rounded-xl transition-all ${isSidebarOpen ? "bg-primary-500 text-white shadow-lg shadow-primary-500/30" : "bg-slate-100 dark:bg-neutral-800 text-slate-500 hover:text-primary-500"}`}
                  title={isSidebarOpen ? "Close Search" : "Search Contacts"}
                >
                  {isSidebarOpen ? <XIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-2 p-1 pl-3 bg-slate-100 dark:bg-neutral-800 rounded-2xl border border-slate-200/50 dark:border-neutral-700/50">
                  <span className="hidden sm:block text-xs font-medium text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                    {currentUser.displayName || "User"}
                  </span>
                  <Link
                    to="/profile"
                    className="interactive rounded-xl overflow-hidden shadow-sm hover:ring-2 ring-primary-500/50 transition-all"
                  >
                    <img
                      className="h-8 w-8 object-cover"
                      src={currentUser.photoURL}
                      alt="Profile"
                      onError={(e) => {
                        e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
                      }}
                    />
                  </Link>
                  <button
                    type="button"
                    className="interactive p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <LogoutIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      {modal && <Logout modal={modal} setModal={setModal} />}
    </>
  );
}
