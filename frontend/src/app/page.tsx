"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BarChart2, Zap, Database, Brain } from "lucide-react";
import { MartinDowLogo } from "@/components/ui/MartinDowLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuthStore } from "@/store";
import { useThemeSync } from "@/hooks/useThemeSync";

const FEATURES = [
  { icon: Database, title: "Live Tableau Data",   desc: "Queries your live VizQL datasource — Secondary Sales DS - BDC." },
  { icon: Brain,    title: "AI-Powered Analysis", desc: "Claude understands your business context and translates questions to VDS queries." },
  { icon: Zap,      title: "Instant Insights",    desc: "Streaming responses with execution transparency so you always know what's happening." },
  { icon: BarChart2,title: "Interactive Charts",  desc: "One click to visualize any answer as bar, line, pie, or KPI cards." },
];

export default function LandingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  useThemeSync();

  useEffect(() => {
    if (hasHydrated && user) router.replace("/workspace");
  }, [hasHydrated, user]);

  // Avoid flashing landing-page content for already-logged-in users while
  // auth state rehydrates from storage (or while the redirect is in flight).
  if (!hasHydrated || user) return null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Mesh background */}
      <div className="fixed inset-0 pointer-events-none">
        <div style={{ background: "radial-gradient(ellipse at 15% 40%, rgba(27,143,168,0.10) 0%, transparent 55%)" }} className="absolute inset-0" />
        <div style={{ background: "radial-gradient(ellipse at 85% 15%, rgba(232,135,26,0.07) 0%, transparent 50%)" }} className="absolute inset-0" />
      </div>

      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--border-soft)" }}>
        <MartinDowLogo height={32} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-amber-500/25 hover:bg-amber-500/10 transition-all"
            style={{ color: "var(--accent-amber-text)" }}
          >
            Sign in <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 border border-teal-500/20 mb-6"
          style={{ color: "var(--accent-teal-text)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          Tableau AI Copilot · Enterprise Preview
        </div>

        <h1 className="text-5xl font-bold mb-4 leading-tight max-w-2xl" style={{ color: "var(--text-primary)" }}>
          Your sales data,{" "}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, #E8871A, #F5B060)" }}>
            answered instantly
          </span>
        </h1>

        <p className="text-lg max-w-lg leading-relaxed mb-10" style={{ color: "var(--text-secondary)" }}>
          Ask natural language questions about your Tableau dashboards. Get live data, AI analysis, and interactive charts — without writing a single query.
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg, #E8871A, #F0973A)", boxShadow: "0 8px 32px rgba(232,135,26,0.25)" }}
        >
          Open Workspace
          <ArrowRight size={16} />
        </Link>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-4xl w-full">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="text-left p-5 rounded-2xl border"
              style={{ background: "var(--surface-strong)", borderColor: "var(--border-soft)" }}
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/12 border border-amber-500/20 flex items-center justify-center mb-3">
                <Icon size={17} className="text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="relative z-10 py-6 text-center text-xs border-t" style={{ borderColor: "var(--border-soft)", color: "var(--text-faint)" }}>
        © {new Date().getFullYear()} Martin Dow Group · Tableau AI Assistant
      </footer>
    </div>
  );
}
