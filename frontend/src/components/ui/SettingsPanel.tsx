"use client";
import { X } from "lucide-react";
import { useSettingsStore } from "@/store";

interface Props { onClose: () => void; }

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b cursor-pointer group" style={{ borderColor: "var(--border-soft)" }}>
      <div>
        <div className="text-sm font-medium transition-colors group-hover:text-[var(--text-primary)]" style={{ color: "var(--text-secondary)" }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{sub}</div>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${checked ? "bg-amber-500" : "bg-[var(--hover-surface)]"}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </label>
  );
}

export function SettingsPanel({ onClose }: Props) {
  const { autoScroll, markdownEnabled, compactMode, themeMode, set } = useSettingsStore();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border-soft)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Preferences</h2>
        <button onClick={onClose} className="transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2">
        <div className="text-xs font-semibold uppercase tracking-widest pt-3 pb-1" style={{ color: "var(--text-faint)" }}>Display</div>
        <Toggle checked={compactMode}      onChange={(v) => set({ compactMode: v })}      label="Compact mode"        sub="Reduce message padding" />
        <Toggle checked={markdownEnabled}  onChange={(v) => set({ markdownEnabled: v })}  label="Markdown rendering"  sub="Format tables, lists, and code" />
        <Toggle checked={autoScroll}       onChange={(v) => set({ autoScroll: v })}       label="Auto-scroll"         sub="Jump to new messages" />

        <Toggle
          checked={themeMode === "light"}
          onChange={(v) => set({ themeMode: v ? "light" : "dark" })}
          label="Light mode"
          sub="Switch between dark and light theme"
        />
      </div>
      <div className="px-5 py-4 border-t" style={{ borderColor: "var(--border-soft)" }}>
        <div className="text-xs text-center" style={{ color: "var(--text-faint)" }}>Settings saved locally · No backend required</div>
      </div>
    </div>
  );
}
