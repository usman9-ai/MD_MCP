"use client";
import { BarChart2, TrendingUp, Search, Package } from "lucide-react";
import { MartinDowLogo } from "@/components/ui/MartinDowLogo";

const SUGGESTIONS = [
  { icon: TrendingUp, label: "Executive Summary", prompt: "Provide me the overall business summary for Neuro care BU, provide me 10 key insights, major oppotunities and concerns." },
  { icon: Package,    label: "100% Target Achievement Plan",        prompt: "Based on the current YTD target achievement of Neuro care BU, what is the plan to achieve 100% target completion for the year 2026?" },
  { icon: Search,     label: "Competitor Analysis",   prompt: "Compare Martin Dow Group with Getz Pharma based on Molecular Performance" },
  { icon: BarChart2,  label: "Sales Achievement",      prompt: "Tell me about the YTD target achievement of Neuro care BU, key drivers and Contribution analysis." },
  { icon: Package,    label: "Price Increase Impact",        prompt: "What is the impact of price increase on YTD sales value and sale units of Neuro care BU, compared to last year same period?" },
  { icon: TrendingUp, label: "Molecule Level Comparison",        prompt: "Provide me a list of all the products from CEFTRIAXONE molecule with their current MAT Value " },
];


const MartinDowIcon = ({ className }: { className?: string }) => (
  <MartinDowLogo height={15} className={className} />
);
interface Props { onPrompt: (p: string) => void; }

export function EmptyState({ onPrompt }: Props) {
  return (
    
      
    <div className="flex flex-col items-center justify-center h-full px-6 py-16 text-center select-none">
      {/* Decorative orb */}

      {/* Decorative orb */}
<div className="relative mb-8">
  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/20 flex items-center justify-center">
    <MartinDowLogo height={34} className="text-white" />
  </div>
  <div
    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-500 animate-pulse-slow"
    style={{ border: "2px solid var(--bg)" }}
  />
</div>


      <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        Tableau AI Chatbot
      </h2>
      <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
        Ask questions about your sales data. Get instant insights from{" "}
        <span className="text-teal-400 font-medium">Secondary Sales</span>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-5xl">
        {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            onClick={() => onPrompt(prompt)}
            className="flex items-start gap-3 text-left p-3.5 rounded-xl border hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 group"
            style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}
          >
            <Icon size={15} className="text-amber-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
            <div>
              <div className="text-xs font-semibold mb-0.5" style={{ color: "var(--text-secondary)" }}>{label}</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>{prompt}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
