"use client";
import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useAuthStore, useSettingsStore } from "@/store";
import { useChat } from "@/hooks/useChat";
import { useThemeSync } from "@/hooks/useThemeSync";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { EmptyState } from "@/components/chat/EmptyState";

export default function WorkspacePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const { markdownEnabled, compactMode, autoScroll } = useSettingsStore();
  const { messages, isStreaming, send, clearConversation, generateChart } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useThemeSync();

  // Auth guard — wait for auth state to rehydrate from storage before
  // deciding to redirect, otherwise a logged-in user briefly reads as
  // logged-out and gets bounced to /login only to bounce right back.
  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, user]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Find the most recent user question for a given assistant message
  const findUserQuestion = useCallback(
    (assistantIdx: number) => {
      for (let i = assistantIdx - 1; i >= 0; i--) {
        if (messages[i].role === "user") return messages[i].content;
      }
      return "";
    },
    [messages]
  );

  if (!hasHydrated || !user) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar onNewChat={clearConversation} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="flex items-center justify-between px-5 shrink-0"
          style={{
            height: 56,
            borderBottom: "1px solid var(--border-soft)",
            background: "var(--surface-muted)",
            backdropFilter: "blur(12px)",
          }}
        >
          <div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>AI Workspace</span>
            <span className="ml-2 text-xs text-teal-400 font-medium">· Secondary Sales</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs hover:text-red-400 hover:bg-red-500/10 transition-all"
                style={{ color: "var(--text-muted)" }}
              >
                <Trash2 size={13} />
                Clear
              </button>
            )}
            <ThemeToggle />
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs"
              style={{ borderColor: "rgba(27,143,168,0.2)", background: "rgba(27,143,168,0.06)" }}>
              <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? "bg-amber-400 animate-pulse" : "bg-teal-400"}`} />
              <span className={isStreaming ? "text-amber-400" : "text-teal-400"}>
                {isStreaming ? "Processing" : "Ready"}
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto"
          style={{ background: "transparent" }}
        >
          {messages.length === 0 ? (
            <EmptyState onPrompt={send} />
          ) : (
            <div className={`mx-auto max-w-3xl w-full px-4 py-6 space-y-6 ${compactMode ? "space-y-4" : ""}`}>
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={isStreaming && idx === messages.length - 1}
                  markdownEnabled={markdownEnabled}
                  compact={compactMode}
                  onVisualize={
                    msg.role === "assistant" && msg.status === "done" && msg.content
                      ? () => generateChart(msg.id, findUserQuestion(idx), msg.content)
                      : undefined
                  }
                />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="shrink-0"
          style={{ borderTop: "1px solid var(--border-soft)", background: "var(--surface-muted)", backdropFilter: "blur(12px)" }}
        >
          <div className="mx-auto max-w-3xl w-full">
            <ChatInput
              onSend={send}
              isStreaming={isStreaming}
              disabled={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
