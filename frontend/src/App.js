import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ToastProvider } from "./contexts/ToastContext";
import Register from "./components/accounts/Register";
import Login from "./components/accounts/Login";
import Profile from "./components/accounts/Profile";
import WithPrivateRoute from "./utils/WithPrivateRoute";
import ChatLayout from "./components/layouts/ChatLayout";

import { useEffect } from "react";

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("color-theme", "dark");
  }, []);

  return (
    <AuthProvider>
      <ChatProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-neutral-950">
            <Router>
              <Routes>
                <Route exact path="/register" element={<Register />} />
                <Route exact path="/login" element={<Login />} />
                <Route
                  exact
                  path="/profile"
                  element={
                    <WithPrivateRoute>
                      <Profile />
                    </WithPrivateRoute>
                  }
                />
                <Route
                  exact
                  path="/"
                  element={
                    <WithPrivateRoute>
                      <ChatLayout />
                    </WithPrivateRoute>
                  }
                />
              </Routes>
            </Router>
          </div>
        </ToastProvider>
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;

