import React, { useState } from "react";
import { User } from "../types";
import { LogIn, UserPlus, Mail, Lock, ShieldAlert, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
  onNavigate: (path: string) => void;
}

export default function AuthForm({ onAuthSuccess, onNavigate }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"customer" | "admin">("customer");
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Please fill in all requested login fields.");
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    const bodyArgs = isLogin ? { email, password } : { email, password, role };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyArgs)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "An authentication error occurred.");
      }

      if (data.success && data.user) {
        if (data.token) {
          localStorage.setItem("aura_jwt_token", data.token);
        }
        setSuccessMsg(isLogin ? "Aura authorization accepted!" : "Account instantiated successfully!");
        setTimeout(() => {
          onAuthSuccess(data.user);
          onNavigate(data.user.role === "admin" ? "/admin/dashboard" : "/");
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to contact server credentials API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto" id="auth-form-container">
      <motion.div 
        className="glass-panel-heavy shadow-2xl rounded-3xl overflow-hidden p-8 space-y-6"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        id="auth-box-card"
      >
        {/* Toggle selectors tab */}
        <div className="flex border-b border-stone-200/40 text-stone-500 text-sm" id="auth-tabs-toggle">
          <button
            onClick={() => {
              setIsLogin(true);
              setErrorMsg(null);
            }}
            className={`w-1/2 py-3 text-center font-serif font-semibold transition-all select-none border-b-2 ${
              isLogin 
                ? "text-stone-900 border-amber-800 font-bold" 
                : "border-transparent text-stone-400 hover:text-stone-750"
            }`}
            id="tab-login-select"
          >
            Client Access
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
              setErrorMsg(null);
            }}
            className={`w-1/2 py-3 text-center font-serif font-semibold transition-all select-none border-b-2 ${
              !isLogin 
                ? "text-stone-900 border-amber-800 font-bold" 
                : "border-transparent text-stone-400 hover:text-stone-750"
            }`}
            id="tab-register-select"
          >
            Atelier Registration
          </button>
        </div>

        {/* Brand visual header */}
        <div className="text-center space-y-1 pt-2">
          <h2 className="font-serif text-2xl font-bold text-stone-900 tracking-tight">
            {isLogin ? "Sign In to Aura" : "Join the Candle Craft"}
          </h2>
          <p className="text-xs text-stone-600 font-sans tracking-wide">
            {isLogin ? "Welcome back. Access your premium burning library." : "Instantiate your account credentials to buy & manage."}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3.5 rounded text-xs flex items-start" id="auth-error-alert">
            <AlertCircle className="w-4 h-4 shrink-0 mr-2 text-red-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded text-xs" id="auth-success-alert">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="auth-form-body">
          {/* Email input field */}
          <div>
            <label className="block text-xs font-mono uppercase text-stone-500 tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white/50 backdrop-blur-sm border border-stone-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 py-2.5 pl-10 pr-4 text-xs text-stone-900 rounded-xl placeholder:text-stone-400 transition-all"
                id="auth-input-email"
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-mono uppercase text-stone-500 tracking-wider">
                Passphrase
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/50 backdrop-blur-sm border border-stone-300/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-700 py-2.5 pl-10 pr-10 text-xs text-stone-900 rounded-xl placeholder:text-stone-400 transition-all"
                id="auth-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-stone-700"
                id="auth-toggle-password-visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Form Action submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 hover:bg-stone-800 text-stone-100 font-serif font-bold text-xs uppercase tracking-wider py-3 rounded shadow hover:shadow-md transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            id="auth-submit-btn"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-stone-600 border-t-white rounded-full animate-spin"></div>
            ) : isLogin ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>Enter Aura</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Instantiate Profile</span>
              </>
            )}
          </button>
        </form>

        {isLogin && (
          <div className="text-center pt-2 border-t border-stone-200/50" id="auth-demo-tip-footer">
            <p className="text-[11px] text-stone-400 font-sans">
              🔒 Admin access requires secure pre-provisioned credentials in MongoDB. Log in with your admin user to access the Atelier portal.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
