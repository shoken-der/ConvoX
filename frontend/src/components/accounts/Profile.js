import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { generateAvatar } from "../../utils/GenerateAvatar";
import ErrorMessage from "../layouts/ErrorMessage";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { XIcon } from "@heroicons/react/outline";

export default function Profile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState();
  const [loading, setLoading] = useState(false);
  const { currentUser, updateUserProfile, setError } = useAuth();

  useEffect(() => {
    const fetchData = () => {
      const res = generateAvatar();
      setAvatars(res);
    };
    fetchData();
    return () => setError(""); // Clear errors on unmount
  }, [setError]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (selectedAvatar === undefined) {
      return setError("Please select an avatar");
    }
    try {
      setError("");
      setLoading(true);
      const profile = {
        displayName: username || currentUser.displayName,
        photoURL: avatars[selectedAvatar],
      };
      await updateUserProfile(currentUser, profile);
      navigate("/");
    } catch (e) {
      setError("Failed to update profile. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-neutral-950 transition-none overflow-y-auto animate-subtle-in">
      <ErrorMessage />
      <div className="max-w-xl w-full relative my-8">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <Card className="relative p-6 md:p-8 rounded-[2rem] group/card">
          <button 
            onClick={() => navigate("/")}
            title="Cancel and Go Back"
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-all duration-200 z-50 focus:outline-none focus:ring-2 ring-primary-500/20"
          >
            <XIcon className="h-6 w-6" />
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              Personalize your profile
            </h2>
            <p className="text-sm text-slate-500 dark:text-neutral-400">
              Pick an avatar and choose how you appear to others
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-3 gap-3 md:gap-4 max-w-md mx-auto">
              {avatars.map((avatar, index) => (
                <div 
                  key={index} 
                  className={`
                    relative group cursor-pointer transition-all duration-300
                    ${index === selectedAvatar ? 'scale-105' : 'hover:scale-102'}
                  `}
                  onClick={() => setSelectedAvatar(index)}
                >
                  <div className={`
                    absolute -inset-1 rounded-full transition-all duration-300
                    ${index === selectedAvatar ? 'bg-primary-500/20 opacity-100 scale-110' : 'bg-slate-100 dark:bg-neutral-800 opacity-0 group-hover:opacity-100 scale-105'}
                  `} />
                  <img
                    alt={`Avatar ${index}`}
                    className={`
                      relative block w-full aspect-square rounded-full shadow-sm z-10 border-2 transition-all duration-300
                      ${index === selectedAvatar ? "border-primary-500" : "border-transparent"}
                    `}
                    src={avatar}
                  />
                  {index === selectedAvatar && (
                    <div className="absolute -top-1.5 -right-1.5 z-20 bg-primary-500 text-white p-1 rounded-full shadow-lg ring-2 ring-white dark:ring-neutral-900">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-6 max-w-sm mx-auto">
              <div className="space-y-1.5">
                <label className="block text-center text-[11px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest leading-none mb-1">
                  Display Name
                </label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="text-center"
                  placeholder="How should we call you?"
                  defaultValue={currentUser.displayName}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading} size="lg" variant="primary" className="w-full">
                {loading ? "Updating..." : "Complete Profile"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
