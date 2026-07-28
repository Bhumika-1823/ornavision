import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Github, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { isAllowedEmailDomain, isValidPassword } from "@/lib/utils";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isAllowedEmailDomain(email)) {
      setError("Please sign in with a valid .com email address (for example yahoo.com).");
      return;
    }
    if (!isValidPassword(password)) {
      setError("Password must be exactly 8 characters and can include uppercase, lowercase, digits, and symbols.");
      return;
    }
    const success = await login(email.trim(), password);
    if (success) {
      setLocation("/");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden pt-20">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] -z-10 mix-blend-screen animate-pulse duration-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-amber-500/10 rounded-full blur-[150px] -z-10 mix-blend-screen"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md px-6 py-10"
      >
        <div className="glass-card rounded-2xl p-8 relative overflow-hidden border border-white/10 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
          
          <div className="text-center mb-8">
            <h1 className="brand-font text-4xl mb-2 gold-gradient-text uppercase tracking-widest">
              Welcome Back
            </h1>
            <p className="text-muted-foreground text-sm font-light tracking-wide">
              Enter your credentials to access your vault
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-primary" />
                {error}
              </div>
            )}
            <div className="space-y-2 relative group">
              <label className="text-xs uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/80 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
              </div>
            </div>

            <div className="space-y-2 relative group">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-primary/80 hover:text-primary transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/80 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-md py-3 pl-10 pr-10 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/80 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full btn-gold h-12 uppercase tracking-widest text-sm font-semibold flex items-center justify-center gap-2 group mt-4">
              Sign In
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-black" />
            </Button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px bg-white/10 flex-1"></div>
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Or continue with</span>
            <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <div className="mt-6 flex justify-center">
            <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md py-3 text-sm transition-all text-foreground hover:text-primary">
              <Github className="w-4 h-4" />
              Github
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
