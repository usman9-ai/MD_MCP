"use client";
import { useState } from "react";
import { MessageSquare, Settings, LogOut, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import { MartinDowLogo } from "@/components/ui/MartinDowLogo";
import { SettingsPanel } from "@/components/ui/SettingsPanel";
import { useAuthStore } from "@/store";

interface Props {
  onNewChat: () => void;
}

export function Sidebar({ onNewChat }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user, logout } = useAuthStore();
  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <>
      {/* Settings drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex transition-all duration-300 ease-in-out
          ${showSettings ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: 280 }}
      >
        <div className="w-full glass flex flex-col shadow-2xl" style={{ borderRight: "1px solid var(--glass-border)" }}>
          {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        </div>
      </div>
      {showSettings && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowSettings(false)} />
      )}

      {/* Main sidebar */}
      <aside
        className="flex flex-col h-full transition-all duration-300 ease-in-out shrink-0"
        style={{
          width: collapsed ? 60 : 220,
          background: "var(--surface)",
          borderRight: "1px solid var(--border-soft)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center px-3 border-b"
          style={{ height: 56, borderColor: "var(--border-soft)" }}
        >
          {!collapsed ? (
            <MartinDowLogo height={28} />
          ) : (
            <BarChart2 size={22} className="text-amber-400 mx-auto" />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-1">
          <button
            onClick={onNewChat}
            className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-[var(--accent-amber-text)] bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <MessageSquare size={16} className="shrink-0" />
            {!collapsed && "New Conversation"}
          </button>
        </nav>

        {/* Bottom actions */}
        <div className="px-2 py-3 border-t space-y-1" style={{ borderColor: "var(--border-soft)" }}>
          <button
            onClick={() => setShowSettings(true)}
            className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-surface)] transition-all ${collapsed ? "justify-center" : ""}`}
          >
            <Settings size={15} className="shrink-0" />
            {!collapsed && "Settings"}
          </button>

          {/* User profile */}
          <div className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${collapsed ? "justify-center" : ""}`}>
            <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xs font-bold text-[var(--accent-teal-text)] shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate text-[var(--text-secondary)]">{user?.username}</div>
                <div className="text-xs text-[var(--text-faint)]">Analyst</div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="text-[var(--text-faint)] hover:text-red-400 transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-9 border-t text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-colors"
          style={{ borderColor: "var(--border-soft)" }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
