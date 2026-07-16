"use client";
import { Sun, Moon, MessageSquare } from "lucide-react";
import { useSettingsStore } from "@/store";

interface Props { className?: string; }

export function ThemeToggle({ className = "" }: Props) {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const set = useSettingsStore((s) => s.set);
  const isLight = themeMode === "light";

  return (
    <button
      type="button"
      onClick={() => set({ themeMode: isLight ? "dark" : "light" })}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className={`flex items-center justify-center w-9 h-9 rounded-lg border transition-colors shrink-0 ${className}`}
      style={{ borderColor: "var(--border)", color: "var(--text-secondary)", background: "var(--surface)" }}
    >
      {isLight ? <Moon size={15} /> : <Sun size={15} />}
    </button>
    
  );

  
}
