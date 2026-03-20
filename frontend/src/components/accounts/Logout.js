import { Fragment, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { LogoutIcon } from "@heroicons/react/outline";
import { useAuth } from "../../contexts/AuthContext";

export default function Logout({ modal, setModal }) {
  const cancelButtonRef = useRef(null);
  const navigate = useNavigate();
  const { logout, setError } = useAuth();

  async function handleLogout() {
    try {
      setError("");
      await logout();
      setModal(false);
      navigate("/login");
    } catch {
      setError("Failed to logout. Please try again.");
    }
  }

  return (
    <Transition.Root show={modal} as={Fragment}>
      <Dialog
        as="div"
        className="fixed z-[100] inset-0 overflow-y-auto p-4"
        initialFocus={cancelButtonRef}
        onClose={setModal}
      >
        <div className="flex items-center justify-center min-h-screen">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
          </Transition.Child>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-4 scale-95"
          >
            <div className="relative bg-white dark:bg-neutral-900 rounded-[2rem] shadow-premium-lg border border-slate-200/50 dark:border-neutral-800/50 overflow-hidden w-full max-w-sm">
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <LogoutIcon className="h-8 w-8 text-rose-500" />
                </div>
                
                <Dialog.Title as="h3" className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Confirm Sign Out
                </Dialog.Title>
                <p className="text-slate-500 dark:text-neutral-400 px-4">
                  Are you sure you want to log out of your account?
                </p>
              </div>

              <div className="p-6 bg-slate-50 dark:bg-neutral-950/50 flex flex-col gap-2">
                <button
                  type="button"
                  className="interactive w-full py-3.5 text-sm font-bold rounded-2xl bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 active:scale-[0.98]"
                  onClick={handleLogout}
                >
                  Sign Out
                </button>
                <button
                  type="button"
                  className="interactive w-full py-3.5 text-sm font-bold text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white rounded-2xl"
                  onClick={() => setModal(false)}
                  ref={cancelButtonRef}
                >
                  Stay Signed In
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
