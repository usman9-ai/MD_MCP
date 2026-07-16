"use client";
import { useState } from "react";
import { Database, ChevronDown, ExternalLink } from "lucide-react";
import type { Citation } from "@/types";

interface Props { citations: Citation[]; }

export function CitationCard({ citations }: Props) {
  const [expanded, setExpanded] = useState(false);
  if (!citations.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-teal-500/20 bg-teal-500/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-teal-500/8 transition-colors"
      >
        <Database size={13} className="text-teal-400 shrink-0" />
        <span className="text-xs font-semibold text-teal-400 uppercase tracking-widest">
          {citations.length === 1 ? "Source" : `${citations.length} Sources`}
        </span>
        <span className="ml-1 text-xs font-normal normal-case tracking-normal truncate text-[var(--text-muted)]">
          {citations[0].source}
          {citations.length > 1 && ` +${citations.length - 1} more`}
        </span>
        <ChevronDown
          size={13}
          className={`ml-auto text-[var(--text-faint)] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-teal-500/15 px-3 py-2.5 space-y-2">
          {citations.map((c, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-[var(--text-secondary)]">{c.source}</div>
                {c.datasource && (
                  <div className="text-xs mt-0.5 flex items-center gap-1 text-[var(--text-faint)]">
                    <span>{c.datasource}</span>
                    <ExternalLink size={10} className="opacity-50" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
