import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { buildHistogram } from "../simulation/returnDistribution";
import { ActivityIcon } from "./icons";

interface CombinedReturnDistributionChartProps {
  dailyReturns: number[];
}

interface ChartRow {
  midpoint: number;
  rangeLabel: string;
  count: number;
}

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: ChartRow }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{payload[0].payload.rangeLabel}</div>
      <div className="chart-tooltip-value">
        <span className="tooltip-line-key" style={{ background: "var(--series-1)" }} />
        Frequency: {payload[0].value}
      </div>
    </div>
  );
}

export function CombinedReturnDistributionChart({
  dailyReturns,
}: CombinedReturnDistributionChartProps) {
  if (dailyReturns.length === 0) {
    return (
      <div className="chart-card">
        <p className="empty-state-text">Not enough simulated data for a return distribution.</p>
      </div>
    );
  }

  const buckets = buildHistogram(dailyReturns, 22);
  const data: ChartRow[] = buckets.map((bucket) => ({
    midpoint: bucket.midpoint,
    rangeLabel: `${bucket.rangeStart.toFixed(2)}% to ${bucket.rangeEnd.toFixed(2)}%`,
    count: bucket.count,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div className="chart-card-heading">
          <span className="chart-card-icon" aria-hidden="true">
            <ActivityIcon size={16} />
          </span>
          <div>
            <h3>Return Distribution</h3>
            <p className="chart-subtitle">
              Distribution of the combined path's day-over-day returns (%) — the same simulation
              run shown in the price chart above. Each day's return already includes that day's
              share of any active Weekly/Monthly constraint, not just the Daily component.
            </p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="midpoint"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            label={{
              value: "Return (%)",
              position: "bottom",
              offset: 8,
              fill: "var(--muted)",
            }}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            width={56}
            allowDecimals={false}
            label={{
              value: "Frequency",
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted)",
            }}
          />
          <Tooltip content={<DistributionTooltip />} />
          <Bar dataKey="count" name="Frequency" fill="var(--series-1)" fillOpacity={0.65} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      <p className="chart-footnote">
        Empirical distribution of the combined path's daily returns — not a theoretical curve.
      </p>
    </div>
  );
}
