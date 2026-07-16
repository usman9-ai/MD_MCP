"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { ChartSpec, MultiValueChartSpec, KpiChartSpec } from "@/types";

const COLORS = ["#E8871A", "#1B8FA8", "#35C0DA", "#F0973A", "#22A8C5", "#F5B060", "#7285A8"];

const tooltipStyle = {
  backgroundColor: "var(--surface-strong)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  fontSize: 12,
};

function KpiCard({ spec }: { spec: KpiChartSpec }) {
  const TrendIcon = spec.trend_direction === "up" ? TrendingUp
    : spec.trend_direction === "down" ? TrendingDown : Minus;
  const trendColor = spec.trend_direction === "up" ? "text-emerald-400"
    : spec.trend_direction === "down" ? "text-red-400" : "text-[var(--text-muted)]";

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
      <div className="text-sm font-semibold uppercase tracking-widest mb-3 text-[var(--text-muted)]">
        {spec.title}
      </div>
      <div className="text-5xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
        {typeof spec.value === "number" ? spec.value.toLocaleString() : spec.value}
      </div>
      {spec.unit && <div className="text-sm mb-3 text-[var(--text-muted)]">{spec.unit}</div>}
      {spec.trend && (
        <div className={`flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
          <TrendIcon size={16} />
          {spec.trend}
        </div>
      )}
    </div>
  );
}

function MultiChart({ spec }: { spec: MultiValueChartSpec }) {
  const data = spec.data.map(d => ({ ...d, name: d.label }));

  const commonProps = {
    data,
    margin: { top: 8, right: 16, left: 0, bottom: 0 },
  };

  const axisProps = {
    tick: { fill: "var(--text-muted)", fontSize: 11 },
    axisLine: { stroke: "var(--border)" },
    tickLine: false,
  };

  const gridProps = {
    strokeDasharray: "3 3",
    stroke: "var(--border-soft)",
    vertical: false,
  };

  if (spec.chart_type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (spec.chart_type === "scatter") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart {...commonProps}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey={spec.x_key} name={spec.x_label} {...axisProps} />
          <YAxis dataKey={spec.y_key} name={spec.y_label} {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          <Scatter data={data} fill={COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (spec.chart_type === "line") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <LineChart {...commonProps}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey={spec.y_key} stroke={COLORS[0]} strokeWidth={2} dot={{ fill: COLORS[0], r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (spec.chart_type === "area") {
    return (
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="name" {...axisProps} />
          <YAxis {...axisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey={spec.y_key} stroke={COLORS[0]} fill="url(#areaGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart {...commonProps}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="name" {...axisProps} tick={{ ...axisProps.tick, fontSize: 10 }} />
        <YAxis {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey={spec.y_key} radius={[3, 3, 0, 0]}>
          {data.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? COLORS[0] : COLORS[1]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

interface Props { spec: ChartSpec; }

export function ChartRenderer({ spec }: Props) {
  const isKpi = spec.chart_type === "kpi" || spec.chart_type === "metric";

  return (
    <div className="mt-3 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface-strong)" }}>
      {!isKpi && (
        <div className="px-4 pt-3 pb-1 border-b" style={{ borderColor: "var(--border-soft)" }}>
          <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {(spec as MultiValueChartSpec).title}
          </h4>
          {((spec as MultiValueChartSpec).x_label || (spec as MultiValueChartSpec).y_label) && (
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {(spec as MultiValueChartSpec).y_label} by {(spec as MultiValueChartSpec).x_label}
            </div>
          )}
        </div>
      )}
      <div className={isKpi ? "" : "px-2 py-3"}>
        {isKpi
          ? <KpiCard spec={spec as KpiChartSpec} />
          : <MultiChart spec={spec as MultiValueChartSpec} />
        }
      </div>
    </div>
  );
}
