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
import { ChartLegend } from "./ChartLegend";
import { ActivityIcon } from "./icons";

interface CombinedReturnDistributionChartProps {
  dailyReturns: number[];
  weeklyReturns: number[];
  monthlyReturns: number[];
}

interface ChartRow {
  midpoint: number;
  rangeLabel: string;
  daily: number;
  weekly: number;
  monthly: number;
}

const SERIES = [
  { key: "daily" as const, name: "Daily", color: "var(--series-1)" },
  { key: "weekly" as const, name: "Weekly", color: "var(--series-2)" },
  { key: "monthly" as const, name: "Monthly", color: "var(--series-3)" },
];

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string; payload: ChartRow }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{payload[0].payload.rangeLabel}</div>
      {payload.map((entry) => (
        <div className="chart-tooltip-value" key={entry.name}>
          <span className="tooltip-line-key" style={{ background: entry.color }} />
          {entry.name}: {entry.value}
        </div>
      ))}
    </div>
  );
}

export function CombinedReturnDistributionChart({
  dailyReturns,
  weeklyReturns,
  monthlyReturns,
}: CombinedReturnDistributionChartProps) {
  const allReturns = [...dailyReturns, ...weeklyReturns, ...monthlyReturns];

  if (allReturns.length === 0) {
    return (
      <div className="chart-card">
        <p className="empty-state-text">Not enough simulated data for a return distribution.</p>
      </div>
    );
  }

  const min = Math.min(...allReturns);
  const max = Math.max(...allReturns);
  const sharedRange: [number, number] = [min, max];

  const dailyBuckets = buildHistogram(dailyReturns, 22, sharedRange);
  const weeklyBuckets = buildHistogram(weeklyReturns, 22, sharedRange);
  const monthlyBuckets = buildHistogram(monthlyReturns, 22, sharedRange);
  const reference = dailyBuckets.length ? dailyBuckets : weeklyBuckets.length ? weeklyBuckets : monthlyBuckets;

  const data: ChartRow[] = reference.map((bucket, i) => ({
    midpoint: bucket.midpoint,
    rangeLabel: `${bucket.rangeStart.toFixed(2)}% to ${bucket.rangeEnd.toFixed(2)}%`,
    daily: dailyBuckets[i]?.count ?? 0,
    weekly: weeklyBuckets[i]?.count ?? 0,
    monthly: monthlyBuckets[i]?.count ?? 0,
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
              Daily, Weekly, and Monthly return distributions on a shared return-% axis — each
              series from its own independent simulation run.
            </p>
          </div>
        </div>
        <ChartLegend items={SERIES} />
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
          {SERIES.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              fillOpacity={0.55}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <p className="chart-footnote">
        Overlaid empirical distributions, binned on the same return-% buckets so Daily, Weekly,
        and Monthly spreads can be compared directly.
      </p>
    </div>
  );
}
