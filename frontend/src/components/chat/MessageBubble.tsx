"use client";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, BarChart2, RefreshCw, User, Sparkles } from "lucide-react";
import { StatusTimeline } from "./StatusTimeline";
import { CitationCard } from "./CitationCard";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import type { ChatMessage } from "@/types";

interface Props {
  message: ChatMessage;
  isStreaming?: boolean;
  onVisualize?: () => void;
  onRegenerate?: () => void;
  markdownEnabled?: boolean;
  compact?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-surface)] transition-colors"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function MessageBubble({
  message,
  isStreaming,
  onVisualize,
  onRegenerate,
  markdownEnabled = true,
  compact = false,
}: Props) {
  const isUser = message.role === "user";
  const streaming = isStreaming && message.status === "streaming";

  if (isUser) {
    return (
      <div
        className="flex justify-end"
        style={{ animation: "slideUp 0.25s ease-out" }}
      >
        <div className="flex items-end gap-2.5 max-w-[75%]">
          <div className="rounded-2xl rounded-tr-sm bg-amber-500/15 border border-amber-500/20 px-4 py-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{message.content}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mb-0.5">
            <User size={13} className="text-amber-400" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div
      className="flex gap-3"
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center shrink-0 mt-0.5">
        <Sparkles size={13} className="text-teal-400" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Execution timeline */}
        {message.steps && message.steps.length > 0 && (
          <StatusTimeline steps={message.steps} isStreaming={streaming} />
        )}

        {/* Message body */}
        {message.content && (
          <div className={`rounded-2xl rounded-tl-sm border px-4 ${compact ? "py-2.5" : "py-3.5"}`} style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}>
            {markdownEnabled ? (
              <div className={`md-content text-sm ${streaming && !message.content.endsWith(" ") ? "streaming-cursor" : ""}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed whitespace-pre-wrap ${streaming ? "streaming-cursor" : ""}`} style={{ color: "var(--text-secondary)" }}>
                {message.content}
              </p>
            )}
          </div>
        )}

        {/* Loading skeleton when no content yet */}
        {streaming && !message.content && (
          <div className="rounded-2xl rounded-tl-sm border px-4 py-3.5" style={{ background: "var(--surface-strong)", borderColor: "var(--border)" }}>
            <div className="flex gap-1.5 items-center h-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-1" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-2" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-3" />
            </div>
          </div>
        )}

        {/* Chart */}
        {message.chartSpec && <ChartRenderer spec={message.chartSpec} />}

        {/* Citation */}
        {message.citation && message.status === "done" && (
          <CitationCard citations={[message.citation]} />
        )}

        {/* Action row */}
        {message.status === "done" && message.content && (
          <div className="flex items-center gap-1 mt-2 -ml-1">
            <CopyButton text={message.content} />
            {onVisualize && (
              <button
                onClick={onVisualize}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--accent-amber-text)] hover:bg-amber-500/10 transition-colors"
              >
                <BarChart2 size={12} />
                Visualize
              </button>
            )}
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-surface)] transition-colors"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
