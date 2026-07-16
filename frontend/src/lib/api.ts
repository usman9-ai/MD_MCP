import type { ChartSpec } from "@/types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function authHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

type BackendCitation = { source: string; datasource?: string };

type ChatResponse = {
  response?: string;
  citations?: Array<BackendCitation | string>;
  chart?: ChartSpec | null;
};

function normalizeChartSpec(payload: unknown): ChartSpec {
  const rawSpec =
    typeof payload === "object" && payload !== null && "react_code" in payload
      ? (payload as { react_code?: unknown }).react_code
      : payload;

  if (typeof rawSpec === "string") {
    return JSON.parse(rawSpec) as ChartSpec;
  }

  return rawSpec as ChartSpec;
}

function normalizeCitations(citations?: ChatResponse["citations"]): BackendCitation[] {
  if (!citations) return [];
  return citations.map((citation) =>
    typeof citation === "string" ? { source: citation } : citation
  );
}

// ── Sign in ──────────────────────────────────────────────────────────────────
export async function signIn(
  username: string,
  password: string
): Promise<{ access_token: string; token_type: string }> {
  const res = await fetch(`${BASE}/chat/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Invalid username or password");
  }
  return res.json();
}

export async function* streamChatV2(
  token: string,
  message: string,
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Chat request failed");
  }

  const payload = (await res.json()) as ChatResponse;
  const response = payload.response ?? "";

  yield { type: "status", message: "Generating response" };

  if (response) {
    const chunks = response.match(/.{1,80}(\s|$)/g) ?? [response];
    for (const chunk of chunks) {
      yield { type: "token", text: chunk };
    }
  }

  yield {
    type: "result",
    response,
    citations: normalizeCitations(payload.citations),
    chart: payload.chart ?? null,
  };
  yield { type: "done" };
}

export async function visualizeV2(
  token: string,
  message: string,
  answer: string
): Promise<ChartSpec> {
  const res = await fetch(`${BASE}/visualize`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message, answer }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Visualization failed");
  }

  return normalizeChartSpec(await res.json());
}

// ── Chat (SSE) ────────────────────────────────────────────────────────────────
export type SSEEvent =
  | { type: "status"; message: string }
  | { type: "token"; text: string }
  | { type: "citation"; source: string }
  | {
      type: "result";
      response: string;
      citations?: Array<BackendCitation | string>;
      chart?: ChartSpec | null;
    }
  | { type: "error"; message: string }
  | { type: "done" };

export async function* streamChat(
  token: string,
  message: string,
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Chat request failed");
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.replace(/^data:\s*/, "").trim();
      if (!line) continue;
      try {
        yield JSON.parse(line) as SSEEvent;
      } catch {
        // malformed chunk — skip
      }
    }
  }
}

// ── Visualize ────────────────────────────────────────────────────────────────
export async function visualize(
  token: string,
  message: string,
  answer: string
): Promise<ChartSpec> {
  const res = await fetch(`${BASE}/visualize`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message, answer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? "Visualization failed");
  }
  return res.json();
}
