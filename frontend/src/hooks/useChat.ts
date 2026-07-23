"use client";
import { useCallback } from "react";
import { clearChat, streamChatV2, visualizeV2 } from "@/lib/api";
import { useChatStore, useAuthStore } from "@/store";
import type { ChatMessage, Citation, StatusStep } from "@/types";

function makeId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function normalizeCitations(citations: Array<{ source: string; datasource?: string } | string>) {
  return citations.map<Citation>((citation) =>
    typeof citation === "string" ? { source: citation } : citation
  );
}

export function useChat() {
  const { messages, addMessage, updateMessage, isStreaming, setStreaming, clearMessages } =
    useChatStore();
  const token = useAuthStore((s) => s.user?.token ?? "");

  const send = useCallback(
    async (text: string) => {
      if (isStreaming || !token) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        content: text,
        status: "done",
        timestamp: Date.now(),
      };
      addMessage(userMsg);

      // Prepare assistant placeholder
      const assistantId = makeId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        status: "streaming",
        steps: [],
        timestamp: Date.now(),
      };
      addMessage(assistantMsg);
      setStreaming(true);

      try {
        let content = "";
        let finalContent = "";
        let finalCitation: Citation | undefined;
        let finalChartSpec: ChatMessage["chartSpec"];
        const steps: StatusStep[] = [];

        for await (const event of streamChatV2(token, text)) {
          if (event.type === "status") {
            // Close any previously running step
            steps.forEach((s) => {
              if (s.status === "running") s.status = "done";
            });
            steps.push({
              id: makeId(),
              message: event.message,
              status: "running",
              timestamp: Date.now(),
            });
            updateMessage(assistantId, { steps: [...steps] });
          } else if (event.type === "token") {
            content += event.text;
            updateMessage(assistantId, { content });
          } else if (event.type === "result") {
            finalContent = event.response || content;
            const citations = event.citations ? normalizeCitations(event.citations) : [];
            finalCitation = citations[0] ?? {
              source: "Martin Dow AI Backend",
              datasource: "Tableau VizQL Data Service",
            };
            finalChartSpec = event.chart ?? undefined;
            updateMessage(assistantId, {
              content: finalContent,
              citation: finalCitation,
              chartSpec: finalChartSpec,
            });
          } else if (event.type === "error") {
            steps.forEach((s) => { if (s.status === "running") s.status = "error"; });
            updateMessage(assistantId, {
              content: content || event.message,
              status: "error",
              steps: [...steps],
            });
            setStreaming(false);
            return;
          } else if (event.type === "done") {
            steps.forEach((s) => { if (s.status === "running") s.status = "done"; });
            updateMessage(assistantId, {
              content: finalContent || content || "",
              status: "done",
              steps: [...steps],
              citation: finalCitation ?? { source: "Martin Dow AI Backend", datasource: "Tableau VizQL Data Service" },
              chartSpec: finalChartSpec,
            });
            setStreaming(false);
            return;
          }
        }

        // Stream ended without done event
        steps.forEach((s) => { if (s.status === "running") s.status = "done"; });
        updateMessage(assistantId, {
          content: finalContent || content,
          status: "done",
          steps: [...steps],
          citation: finalCitation ?? { source: "Martin Dow AI Backend", datasource: "Tableau VizQL Data Service" },
          chartSpec: finalChartSpec,
        });
      } catch (err: any) {
        updateMessage(assistantId, {
          content: err?.message ?? "Something went wrong.",
          status: "error",
        });
      } finally {
        setStreaming(false);
      }
    },
    [messages, token, isStreaming, addMessage, updateMessage, setStreaming]
  );

  const clearConversation = useCallback(async () => {
    try {
      if (token) {
        await clearChat(token);
      }
    } catch (err) {
      console.error("Clear chat error:", err);
    } finally {
      clearMessages();
      setStreaming(false);
    }
  }, [token, clearMessages, setStreaming]);

  const generateChart = useCallback(
    async (messageId: string, question: string, answer: string) => {
      if (!token) return;
      try {
        updateMessage(messageId, { chartSpec: undefined });
        const spec = await visualizeV2(token, question, answer);
        updateMessage(messageId, { chartSpec: spec });
      } catch (err) {
        console.error("Visualize error:", err);
      }
    },
    [token, updateMessage]
  );

  return { messages, isStreaming, send, clearConversation, generateChart };
}
