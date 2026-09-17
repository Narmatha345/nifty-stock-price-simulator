import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  buildHistogram,
  calculateReturnStats,
  fittedNormalFrequency,
  type HistogramBucket,
} from "../simulation/returnDistribution";
import { formatPercent } from "../utils/format";
import { ActivityIcon, HashIcon, PercentIcon, TrendingDownIcon, TrendingUpIcon } from "./icons";

interface ReturnDistributionSectionProps {
  /** "Week" or "Month" — every label is derived from this. */
  periodLabel: "Week" | "Month";
  /** Flattened period returns (%) across every simulated scenario. */
  returns: number[];
  scenarioCount: number;
  baseSeed: number;
  onConfigureScenarios: () => void;
}

interface ChartRow extends HistogramBucket {
  rangeLabel: string;
  fitted: number;
}

function DistributionTooltip({
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
      <div className="chart-tooltip-label">{row.rangeLabel}</div>
      <div className="chart-tooltip-value">
        <span className="tooltip-line-key price-key" />
        {row.count} {periodLabel.toLowerCase()}(s)
      </div>
    </div>
  );
}

export function ReturnDistributionSection({
  periodLabel,
  returns,
  scenarioCount,
  baseSeed,
  onConfigureScenarios,
}: ReturnDistributionSectionProps) {
  const adjective = `${periodLabel}ly`; // "Week" -> "Weekly", "Month" -> "Monthly"
  const stats = calculateReturnStats(returns);
  const buckets = buildHistogram(returns);

  const data: ChartRow[] = buckets.map((bucket) => ({
    ...bucket,
    rangeLabel: `${bucket.rangeStart.toFixed(1)}% to ${bucket.rangeEnd.toFixed(1)}%`,
    fitted:
      stats && stats.stdDev > 0
        ? fittedNormalFrequency(bucket, stats.count, stats.mean, stats.stdDev)
        : 0,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <ActivityIcon size={16} />
        </span>
        <div>
          <h3>{adjective} Return Distribution</h3>
          <p className="chart-subtitle">
            Empirical distribution of {periodLabel.toLowerCase()}ly returns across{" "}
            {scenarioCount.toLocaleString("en-IN")} simulated scenarios (base seed {baseSeed}) —
            the same scenario data used by Conditional Probability.{" "}
            <button type="button" className="link-button" onClick={onConfigureScenarios}>
              Configure scenarios
            </button>
          </p>
        </div>
      </div>

      {!stats ? (
        <p className="empty-state-text">Not enough simulated data for a return distribution.</p>
      ) : (
        <>
          <section className="dist-stats-cards" aria-label={`${adjective} return statistics`}>
            <div className="card">
              <span className="card-icon"><PercentIcon size={15} /></span>
              <span className="card-label">Mean {adjective} Return</span>
              <span className="card-value">{formatPercent(stats.mean)}</span>
            </div>
            <div className="card">
              <span className="card-icon"><ActivityIcon size={15} /></span>
              <span className="card-label">Standard Deviation</span>
              <span className="card-value">{formatPercent(stats.stdDev)}</span>
            </div>
            <div className="card card-positive">
              <span className="card-icon"><TrendingUpIcon size={15} /></span>
              <span className="card-label">Positive {periodLabel} %</span>
              <span className="card-value">{stats.positivePercent.toFixed(1)}%</span>
            </div>
            <div className="card card-negative">
              <span className="card-icon"><TrendingDownIcon size={15} /></span>
              <span className="card-label">Negative {periodLabel} %</span>
              <span className="card-value">{stats.negativePercent.toFixed(1)}%</span>
            </div>
            <div className="card">
              <span className="card-icon"><HashIcon size={15} /></span>
              <span className="card-label">Number of {periodLabel}ly Observations</span>
              <span className="card-value">{stats.count.toLocaleString("en-IN")}</span>
            </div>
          </section>

          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
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
                  value: `${adjective} Return (%)`,
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
              <Tooltip content={<DistributionTooltip periodLabel={periodLabel} />} />
              <Bar dataKey="count" fill="var(--series-1)" fillOpacity={0.75} isAnimationActive={false} />
              <Line
                type="monotone"
                dataKey="fitted"
                name="Fitted Normal Curve"
                stroke="var(--accent-2)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="chart-footnote">
            Bars: empirical distribution of simulated {periodLabel.toLowerCase()}ly returns. Dashed
            line: fitted normal curve — a theoretical reference computed from this same mean and
            standard deviation, not a claim that returns are guaranteed to be normally
            distributed.
          </p>
        </>
      )}

      <div className="info-card">
        <p className="info-card-title">How to read this</p>
        <p>
          This distribution shows how frequently different {periodLabel.toLowerCase()}ly returns
          occurred across the simulated data.
        </p>
        <p>
          Returns near the center occurred more frequently, while returns farther from the
          center occurred less frequently.
        </p>
        <p className="disclaimer-line">
          Simulation-based analysis — not a prediction of actual NIFTY returns.
        </p>
      </div>
    </div>
  );
}
