"use client";
import { CheckCircle, Circle, AlertCircle, Loader2, Database, Search, Zap, Brain } from "lucide-react";
import type { StatusStep } from "@/types";

function stepIcon(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("connect") || m.includes("tableau")) return Database;
  if (m.includes("query") || m.includes("execut")) return Search;
  if (m.includes("generat") || m.includes("response")) return Brain;
  return Zap;
}

interface Props { steps: StatusStep[]; isStreaming?: boolean; }

export function StatusTimeline({ steps, isStreaming }: Props) {
  if (!steps.length) return null;

  return (
    <div className="mb-3 space-y-1.5">
      {steps.map((step, i) => {
        const Icon = stepIcon(step.message);
        const isDone    = step.status === "done";
        const isRunning = step.status === "running";
        const isError   = step.status === "error";

        return (
          <div
            key={step.id}
            className="flex items-center gap-2.5 text-sm"
            style={{ animation: "slideUp 0.3s ease-out both", animationDelay: `${i * 60}ms` }}
          >
            {/* connector line */}
            <div className="flex flex-col items-center" style={{ minWidth: 20 }}>
              {i > 0 && <div className="w-px h-1.5 mb-0.5" style={{ background: "var(--border)" }} />}
              <div className={`
                flex items-center justify-center rounded-full w-5 h-5 shrink-0
                ${isDone    ? "text-teal-400" : ""}
                ${isRunning ? "text-amber-400" : ""}
                ${isError   ? "text-red-400" : ""}
                ${step.status === "pending" ? "text-[var(--text-faint)]" : ""}
              `}>
                {isRunning ? (
                  <Loader2 size={14} className="animate-spin text-amber-400" />
                ) : isDone ? (
                  <CheckCircle size={14} />
                ) : isError ? (
                  <AlertCircle size={14} />
                ) : (
                  <Circle size={14} />
                )}
              </div>
            </div>

            <div className={`flex items-center gap-1.5 ${isDone ? "text-[var(--text-muted)]" : isRunning ? "text-[var(--accent-amber-text)]" : isError ? "text-red-400" : "text-[var(--text-faint)]"}`}>
              <Icon size={12} className="shrink-0 opacity-70" />
              <span className="text-xs font-medium tracking-wide">{step.message}</span>
            </div>
          </div>
        );
      })}

      {/* Live thinking dots while streaming */}
      {isStreaming && steps.every(s => s.status === "done") && (
        <div className="flex items-center gap-1.5 pl-7 pt-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-1" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-2" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 dot-3" />
        </div>
      )}
    </div>
  );
}
