import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { buildHistogram, calculateReturnStats } from "../simulation/returnDistribution";
import type { MultiPathResult } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { ActivityIcon } from "./icons";

interface CombinedReturnDistributionChartProps {
  dailyReturns: number[];
  /** When set (and numberOfPaths > 1), shows the ending-price distribution across all paths instead. */
  multiPath: MultiPathResult | null;
}

interface ChartRow {
  midpoint: number;
  rangeLabel: string;
  count: number;
}

interface EndPriceChartRow {
  midpoint: number;
  rangeLabel: string;
  count: number;
}

function EndPriceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: EndPriceChartRow }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const pathWord = payload[0].value === 1 ? "path" : "paths";
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Ending price {row.rangeLabel}</div>
      <div className="chart-tooltip-value">
        <span
          className="tooltip-line-key"
          style={{ background: "var(--series-1)" }}
        />
        {payload[0].value} {pathWord}
      </div>
    </div>
  );
}

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: ChartRow }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const dayWord = payload[0].value === 1 ? "day" : "days";
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Return between {row.rangeLabel}</div>
      <div className="chart-tooltip-value">
        <span
          className="tooltip-line-key"
          style={{ background: row.midpoint >= 0 ? "var(--good)" : "var(--critical)" }}
        />
        {payload[0].value} {dayWord}
      </div>
    </div>
  );
}

export function CombinedReturnDistributionChart({
  dailyReturns,
  multiPath,
}: CombinedReturnDistributionChartProps) {
  if (multiPath && multiPath.summary.numberOfPaths > 1) {
    const { endingPrices, summary } = multiPath;
    const buckets = buildHistogram(endingPrices, 22);
    const data: EndPriceChartRow[] = buckets.map((bucket) => ({
      midpoint: bucket.midpoint,
      rangeLabel: `${formatCurrency(bucket.rangeStart)} to ${formatCurrency(bucket.rangeEnd)}`,
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
              <h3>Ending Price Distribution ({summary.numberOfPaths.toLocaleString("en-IN")} paths)</h3>
              <p className="chart-subtitle">
                Where every simulated path ended up after {summary.totalDays} days.{" "}
                <span style={{ color: "var(--good)" }}>Green</span> bars ended above the starting
                price, <span style={{ color: "var(--critical)" }}>red</span> bars ended below —
                taller bars mean that outcome happened more often.
              </p>
            </div>
          </div>
        </div>

        <p className="distribution-summary">
          Out of {summary.numberOfPaths.toLocaleString("en-IN")} simulated paths,{" "}
          <strong style={{ color: "var(--good)" }}>
            {Math.round(summary.percentProfitable)}% ended above
          </strong>{" "}
          and{" "}
          <strong style={{ color: "var(--critical)" }}>
            {Math.round(100 - summary.percentProfitable)}% ended at or below
          </strong>{" "}
          the starting price of {formatCurrency(summary.startPrice)} — the median outcome was{" "}
          {formatCurrency(summary.endPrice.median)}.
        </p>

        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }} barCategoryGap="2%">
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis
              dataKey="midpoint"
              type="category"
              interval={Math.max(0, Math.ceil(data.length / 4) - 1)}
              padding={{ left: 0, right: 0 }}
              tickFormatter={(v: number) => Math.round(v).toLocaleString("en-IN")}
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--baseline)" }}
              tickLine={false}
              label={{
                value: "Ending NIFTY Price (₹)",
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
                value: "Number of Paths",
                angle: -90,
                position: "insideLeft",
                fill: "var(--muted)",
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip content={<EndPriceTooltip />} cursor={{ fill: "var(--surface-2)" }} />
            <Bar dataKey="count" name="Paths" isAnimationActive={false}>
              {data.map((row) => (
                <Cell
                  key={row.midpoint}
                  fill={row.midpoint >= summary.startPrice ? "var(--good)" : "var(--critical)"}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="chart-footnote">
          Losses on the left, gains on the right. Exact distribution across every simulated
          path's final price — not a theoretical curve.
        </p>
      </div>
    );
  }

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

  const stats = calculateReturnStats(dailyReturns);

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
              How often the simulated NIFTY price went up or down each day.{" "}
              <span style={{ color: "var(--good)" }}>Green</span> bars are days it gained,{" "}
              <span style={{ color: "var(--critical)" }}>red</span> bars are days it lost — taller
              bars mean that outcome happened more often.
            </p>
          </div>
        </div>
      </div>

      {stats && (
        <p className="distribution-summary">
          Out of {stats.count} simulated days,{" "}
          <strong style={{ color: "var(--good)" }}>
            {Math.round(stats.positivePercent)}% gained
          </strong>{" "}
          and{" "}
          <strong style={{ color: "var(--critical)" }}>
            {Math.round(stats.negativePercent)}% lost
          </strong>{" "}
          value — the average day moved {formatPercent(stats.mean)}.
        </p>
      )}

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }} barCategoryGap="2%">
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="midpoint"
            type="category"
            interval={Math.max(0, Math.ceil(data.length / 9) - 1)}
            padding={{ left: 0, right: 0 }}
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            label={{
              value: "Daily Price Change (%)",
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
              value: "Number of Days",
              angle: -90,
              position: "insideLeft",
              fill: "var(--muted)",
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip content={<DistributionTooltip />} cursor={{ fill: "var(--surface-2)" }} />
          <Bar dataKey="count" name="Days" isAnimationActive={false}>
            {data.map((row) => (
              <Cell
                key={row.midpoint}
                fill={row.midpoint >= 0 ? "var(--good)" : "var(--critical)"}
                fillOpacity={0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="chart-footnote">
        Losses on the left, gains on the right. Based on the same combined simulation shown in
        the price chart above.
      </p>
    </div>
  );
}
