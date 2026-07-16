// ── Chat ─────────────────────────────────────────────────────────────────────
export type MessageRole = "user" | "assistant";

export interface StatusStep {
  id: string;
  message: string;
  status: "pending" | "running" | "done" | "error";
  timestamp: number;
}

export interface Citation {
  source: string;
  datasource?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  status?: "streaming" | "done" | "error";
  steps?: StatusStep[];
  citation?: Citation;
  chartSpec?: ChartSpec;
  timestamp: number;
}

// ── Chart specs ───────────────────────────────────────────────────────────────
export type ChartType = "bar" | "line" | "area" | "pie" | "scatter" | "kpi" | "metric";

export interface DataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

export interface MultiValueChartSpec {
  chart_type: Exclude<ChartType, "kpi" | "metric">;
  title: string;
  x_key: string;
  y_key: string;
  x_label?: string;
  y_label?: string;
  data: DataPoint[];
}

export interface KpiChartSpec {
  chart_type: "kpi" | "metric";
  title: string;
  value: number | string;
  unit?: string;
  trend?: string;
  trend_direction?: "up" | "down" | "neutral";
}

export type ChartSpec = MultiValueChartSpec | KpiChartSpec;

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  username: string;
  token: string;
}

// ── Settings ─────────────────────────────────────────────────────────────────
export interface AppSettings {
  autoScroll: boolean;
  markdownEnabled: boolean;
  compactMode: boolean;
  themeMode: "dark" | "light";
}
