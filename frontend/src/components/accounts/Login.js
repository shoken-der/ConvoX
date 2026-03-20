import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ErrorMessage from "../layouts/ErrorMessage";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser, login, setError } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  async function handleFormSubmit(e) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/");
    } catch (e) {
      console.error("Login error:", e);
      setError(e.message || "Failed to login. Please check your credentials.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
      <ErrorMessage />
      <div className="max-w-md w-full relative">
        {/* Background blobs for depth */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-20 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl" />

        <Card className="relative p-8 md:p-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-primary-400 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-neutral-400">
              Please enter your details to sign in
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleFormSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">
                Email Address
              </label>
              <Input
                id="email-address"
                name="email"
                type="email"
                required
                placeholder="xyz@gmail.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1 flex justify-between">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} size="lg" variant="primary" className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/register"
                className="text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
              >
                Don't have an account? <span className="font-bold text-primary-600 dark:text-primary-400">Join now</span>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
