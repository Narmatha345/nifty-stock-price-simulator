import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { SimulationStep } from "../simulation/types";
import { formatCurrency } from "../utils/format";
import { ChartLegend } from "./ChartLegend";
import { MarketIcon } from "./icons";

interface CombinedPriceChartProps {
  daily: SimulationStep[];
  weekly: SimulationStep[];
  monthly: SimulationStep[];
}

interface ChartRow {
  index: number;
  daily?: number;
  weekly?: number;
  monthly?: number;
}

const SERIES = [
  { key: "daily" as const, name: "Daily", color: "var(--series-1)" },
  { key: "weekly" as const, name: "Weekly", color: "var(--series-2)" },
  { key: "monthly" as const, name: "Monthly", color: "var(--series-3)" },
];

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Period {label}</div>
      {payload.map((entry) => (
        <div className="chart-tooltip-value" key={entry.name}>
          <span className="tooltip-line-key" style={{ background: entry.color }} />
          {entry.name}: {formatCurrency(entry.value)}
        </div>
      ))}
    </div>
  );
}

export function CombinedPriceChart({ daily, weekly, monthly }: CombinedPriceChartProps) {
  const maxLength = Math.max(daily.length, weekly.length, monthly.length);
  const data: ChartRow[] = Array.from({ length: maxLength }, (_, i) => ({
    index: i,
    daily: daily[i]?.price,
    weekly: weekly[i]?.price,
    monthly: monthly[i]?.price,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-heading">
          <span className="chart-card-icon" aria-hidden="true">
            <MarketIcon size={16} />
          </span>
          <div>
            <h3>Simulated NIFTY Price</h3>
            <p className="chart-subtitle">
              Daily, Weekly, and Monthly price paths plotted by period number (Day 1, Week 1,
              Month 1, ...) — each line from its own independent simulation run.
            </p>
          </div>
        </div>
        <ChartLegend items={SERIES} />
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="index"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            label={{
              value: "Period Number (Day / Week / Month)",
              position: "bottom",
              offset: 8,
              fill: "var(--muted)",
            }}
          />
          <YAxis
            domain={[
              (min: number) => Math.floor(min * 0.98),
              (max: number) => Math.ceil(max * 1.02),
            ]}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            width={72}
            tickFormatter={(v: number) => v.toLocaleString("en-IN")}
            label={{
              value: "NIFTY Price (₹)",
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted)",
            }}
          />
          <Tooltip content={<PriceTooltip />} />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-footnote">
        Simulated paths — not a market forecast. Each line ends where its own simulation run
        ends.
      </p>
    </div>
  );
}
