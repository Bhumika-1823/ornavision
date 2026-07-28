import React, { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Mail, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage(null);
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    setMessage(
      "If this email exists in our system, we have sent a password reset link. Please check your inbox.",
    );
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center overflow-hidden pt-20">
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
              Reset Password
            </h1>
            <p className="text-muted-foreground text-sm font-light tracking-wide">
              Enter your registered email and we will send a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm p-3 rounded-md">
                {message}
              </div>
            )}

            <div className="space-y-2 relative group">
              <label className="text-xs uppercase tracking-wider text-muted-foreground group-focus-within:text-primary transition-colors">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
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

            <Button type="submit" className="w-full btn-gold h-12 uppercase tracking-widest text-sm font-semibold flex items-center justify-center gap-2 group mt-4">
              Send Reset Link
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Remembered your password? {" "}
            <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
