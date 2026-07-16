"use client";
import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Square } from "lucide-react";

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled, isStreaming, placeholder }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
    }
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isStreaming) return;
    onSend(trimmed);
    setValue("");
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className="relative flex items-end gap-3 rounded-2xl border bg-[var(--input-bg)] transition-all duration-200 focus-ring"
        style={{ borderColor: "var(--border)" }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKey}
          disabled={disabled}
          placeholder={placeholder ?? "Ask anything about your Tableau data…"}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-[var(--input-text)] placeholder:text-[var(--input-placeholder)] outline-none min-h-[52px] max-h-[180px] leading-relaxed"
        />

        <div className="pb-2.5 pr-2.5">
          <button
            onClick={submit}
            disabled={(!value.trim() && !isStreaming) || disabled}
            className={`
              flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200
              ${value.trim() || isStreaming
                ? "bg-amber-500 hover:bg-amber-400 text-white shadow-lg shadow-amber-500/20"
                : "bg-[var(--hover-surface)] text-[var(--text-faint)] cursor-not-allowed"}
            `}
          >
            {isStreaming
              ? <Square size={14} className="fill-current" />
              : <Send size={14} />
            }
          </button>
        </div>
      </div>

    </div>
  );
}
