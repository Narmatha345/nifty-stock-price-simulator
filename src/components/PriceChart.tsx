import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SimulationDay } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { AreaChartIcon, LineChartIcon, MarketIcon, TableIcon } from "./icons";

interface PriceChartProps {
  days: SimulationDay[];
}

type ChartView = "line" | "area" | "table";

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Day {label}</div>
      <div className="chart-tooltip-value">
        <span className="tooltip-line-key price-key" />
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
}

const axisProps = {
  cartesianGrid: { stroke: "var(--gridline)", vertical: false },
  xAxis: {
    dataKey: "day" as const,
    tick: { fill: "var(--muted)", fontSize: 12 },
    axisLine: { stroke: "var(--baseline)" },
    tickLine: false,
    label: { value: "Day", position: "bottom" as const, offset: 8, fill: "var(--muted)" },
  },
  yAxis: {
    domain: [
      (min: number) => Math.floor(min * 0.98),
      (max: number) => Math.ceil(max * 1.02),
    ] as [(min: number) => number, (max: number) => number],
    tick: { fill: "var(--muted)", fontSize: 12 },
    axisLine: { stroke: "var(--baseline)" },
    tickLine: false,
    width: 72,
    tickFormatter: (v: number) => v.toLocaleString("en-IN"),
  },
};

export function PriceChart({ days }: PriceChartProps) {
  const [view, setView] = useState<ChartView>("line");

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-heading">
          <span className="chart-card-icon" aria-hidden="true">
            <MarketIcon size={16} />
          </span>
          <div>
            <h3>Simulated NIFTY Price</h3>
            <p className="chart-subtitle">Day-by-day price path for this simulation run.</p>
          </div>
        </div>
        <div className="view-tabs" role="tablist" aria-label="Chart view">
          <button
            type="button"
            role="tab"
            aria-selected={view === "line"}
            className={`view-tab ${view === "line" ? "view-tab-active" : ""}`}
            onClick={() => setView("line")}
          >
            <LineChartIcon size={14} /> Line
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "area"}
            className={`view-tab ${view === "area" ? "view-tab-active" : ""}`}
            onClick={() => setView("area")}
          >
            <AreaChartIcon size={14} /> Area
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "table"}
            className={`view-tab ${view === "table" ? "view-tab-active" : ""}`}
            onClick={() => setView("table")}
          >
            <TableIcon size={14} /> Table
          </button>
        </div>
      </div>

      {view !== "table" ? (
        <ResponsiveContainer width="100%" height={360}>
          {view === "line" ? (
            <LineChart data={days} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <CartesianGrid {...axisProps.cartesianGrid} />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <Tooltip content={<PriceTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <AreaChart data={days} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
              <defs>
                <linearGradient id="priceAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-2)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-1)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...axisProps.cartesianGrid} />
              <XAxis {...axisProps.xAxis} />
              <YAxis {...axisProps.yAxis} />
              <Tooltip content={<PriceTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--series-1)"
                strokeWidth={2}
                fill="url(#priceAreaFill)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      ) : (
        <div className="table-scroll chart-inline-table">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Daily Return %</th>
                <th>NIFTY Price</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td
                    className={
                      d.dailyReturnPercent === null
                        ? ""
                        : d.dailyReturnPercent >= 0
                          ? "positive"
                          : "negative"
                    }
                  >
                    {d.dailyReturnPercent === null ? "—" : formatPercent(d.dailyReturnPercent)}
                  </td>
                  <td>{formatCurrency(d.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="chart-footnote">Simulated path — not a market forecast.</p>
    </div>
  );
}
