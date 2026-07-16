"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { MartinDowLogo } from "@/components/ui/MartinDowLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { signIn } from "@/lib/api";
import { useAuthStore } from "@/store";
import { useThemeSync } from "@/hooks/useThemeSync";

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser, hasHydrated } = useAuthStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useThemeSync();

  useEffect(() => {
    if (hasHydrated && user) router.replace("/workspace");
  }, [hasHydrated, user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      const data = await signIn(username.trim(), password);
      setUser({ username: username.trim(), token: data.access_token });
      router.push("/workspace");
    } catch (err: any) {
      setError(err.message ?? "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Avoid flashing the login form for already-logged-in users while auth
  // state rehydrates from storage (or while the redirect is in flight).
  if (!hasHydrated || user) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      {/* bg accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(27,143,168,0.09) 0%, transparent 55%)" }} className="absolute inset-0" />
        <div style={{ background: "radial-gradient(ellipse at 75% 25%, rgba(232,135,26,0.07) 0%, transparent 50%)" }} className="absolute inset-0" />
      </div>

      <div className="fixed top-5 right-5 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-2xl border px-8 py-9 shadow-2xl"
          style={{ background: "var(--glass-bg)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-7">
            <MartinDowLogo height={34} />
          </div>

          <h1 className="text-lg font-semibold text-center mb-1" style={{ color: "var(--text-primary)" }}>
            Sign in to your workspace
          </h1>


          <form onSubmit={submit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all"
                style={{ borderColor: "var(--border)", background: "var(--input-bg)", color: "var(--input-text)" }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(232,135,26,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                placeholder="username"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm outline-none transition-all"
                  style={{ borderColor: "var(--border)", background: "var(--input-bg)", color: "var(--input-text)" }}
                  onFocus={(e) => { e.target.style.borderColor = "rgba(232,135,26,0.4)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "var(--text-faint)" }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle size={13} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 mt-1"
              style={{ background: "linear-gradient(135deg, #E8871A, #F0973A)", boxShadow: "0 4px 20px rgba(232,135,26,0.2)" }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>


      </div>
    </div>
  );
}
