import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { AggregatedPeriod } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { MarketIcon } from "./icons";

interface PeriodChartProps {
  title: string;
  subtitle: string;
  periods: AggregatedPeriod[];
  /** "Week" or "Month" — used for the X-axis tick labels and tooltip. */
  periodLabel: string;
}

interface ChartRow {
  label: string;
  periodNumber: number;
  endPrice: number;
  startPrice: number;
  returnPercent: number;
}

function PeriodTooltip({
  active,
  payload,
  periodLabel,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  periodLabel: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">
        {periodLabel} {row.periodNumber}
      </div>
      <div className="chart-tooltip-value">Start: {formatCurrency(row.startPrice)}</div>
      <div className="chart-tooltip-value">End: {formatCurrency(row.endPrice)}</div>
      <div
        className={`chart-tooltip-value ${row.returnPercent >= 0 ? "positive" : "negative"}`}
      >
        Return: {formatPercent(row.returnPercent)}
      </div>
    </div>
  );
}

export function PeriodChart({ title, subtitle, periods, periodLabel }: PeriodChartProps) {
  const data: ChartRow[] = periods.map((p) => ({
    label: `${periodLabel} ${p.periodNumber}`,
    periodNumber: p.periodNumber,
    endPrice: p.endPrice,
    startPrice: p.startPrice,
    returnPercent: p.returnPercent,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <MarketIcon size={16} />
        </span>
        <div>
          <h3>{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            interval="preserveStartEnd"
            label={{ value: periodLabel, position: "bottom", offset: 8, fill: "var(--muted)" }}
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
          <Tooltip content={<PeriodTooltip periodLabel={periodLabel} />} />
          <Line
            type="monotone"
            dataKey="endPrice"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: "var(--series-1)" }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-footnote">Simulated path — not a market forecast.</p>
    </div>
  );
}
