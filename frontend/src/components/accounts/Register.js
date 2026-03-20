import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ErrorMessage from "../layouts/ErrorMessage";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser, register, setError } = useAuth();

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    try {
      setError("");
      setLoading(true);
      await register(email, password);
      navigate("/profile");
    } catch (e) {
      console.error("Registration error:", e);
      setError(e.message || "Failed to create an account. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-neutral-950 transition-colors duration-300">
      <ErrorMessage />
      <div className="max-w-md w-full relative">
        <div className="absolute -top-24 -right-20 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-20 w-64 h-64 bg-secondary-500/10 rounded-full blur-3xl" />

        <Card className="relative p-8 md:p-10">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              Create account
            </h2>
            <p className="text-slate-500 dark:text-neutral-400">
              Start chatting with your friends today
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
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest pl-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              variant="primary"
              className="w-full"
            >
              {loading ? "Creating account..." : "Get started"}
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400 transition-colors"
              >
                Already registered? <span className="font-bold text-primary-600 dark:text-primary-400">Sign in</span>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
