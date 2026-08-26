"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, ShieldCheck, Lock, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const search = useSearchParams();
  const router = useRouter();
  const error = search.get("error");
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error ?? "Failed to start Google login");
      }
      window.location.href = data.url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google login failed");
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "Invalid credentials");
      }
      toast.success("Welcome back, Administrator");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to store
        </Link>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-full bg-neutral-900 dark:bg-white flex items-center justify-center">
              <span className="font-serif text-sm tracking-widest text-white dark:text-neutral-900">
                M
              </span>
            </div>
            <div>
              <h1 className="text-xl font-serif tracking-tight">MEME Atelier</h1>
              <p className="text-xs text-neutral-500">Staff Sign In</p>
            </div>
          </div>

          {error === "access-denied" && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              Access denied. Your Google account is not authorized for admin access.
            </div>
          )}

          {/* Login Mode Toggle Tabs */}
          <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setUsePassword(false)}
              className={`text-xs font-medium py-2 rounded-md transition-all ${
                !usePassword
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Google Sign In
            </button>
            <button
              type="button"
              onClick={() => setUsePassword(true)}
              className={`text-xs font-medium py-2 rounded-md transition-all ${
                usePassword
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Staff Password
            </button>
          </div>

          {!usePassword ? (
            <div className="space-y-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Sign in with your authorized Gmail account to access the admin panel.
              </p>

              <Button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full gap-3 bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white dark:border-neutral-700 h-11"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                {loading ? "Connecting…" : "Sign in with Google"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Username / Email
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="admin or zanoon.bis@gmail.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 pl-9"
                    required
                  />
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-9"
                    required
                  />
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in to Dashboard"}
              </Button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            <p>Direct staff access enabled. Session active for 24 hours.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
