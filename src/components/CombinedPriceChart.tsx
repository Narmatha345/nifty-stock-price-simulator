import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import type { CombinedSimulationStep, MultiPathResult } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { ChartLegend } from "./ChartLegend";
import { MarketIcon } from "./icons";

interface CombinedPriceChartProps {
  steps: CombinedSimulationStep[];
  /** When set (and numberOfPaths > 1), renders a fan chart across all paths instead of the single line. */
  multiPath: MultiPathResult | null;
}

interface ChartRow {
  day: number;
  price: number;
  weeklyMarker?: number;
  monthlyMarker?: number;
  weeklyReturnPercent: number | null;
  weeklyTargetReturnPercent: number | null;
  monthlyReturnPercent: number | null;
  monthlyTargetReturnPercent: number | null;
  weekIndex: number | null;
  monthIndex: number | null;
}

interface FanRow {
  day: number;
  p10: number;
  p25: number;
  median: number;
  p75: number;
  p90: number;
  sampled: boolean;
  weeklyMarker?: number;
  monthlyMarker?: number;
  weekIndex: number | null;
  weekMedianReturnPercent: number | null;
  monthIndex: number | null;
  monthMedianReturnPercent: number | null;
}

const LEGEND_ITEMS = [
  { name: "Simulated Price", color: "var(--series-1)" },
  { name: "Week Checkpoint", color: "var(--series-2)" },
  { name: "Month Checkpoint", color: "var(--series-3)" },
];

const FAN_LEGEND_ITEMS = [
  { name: "Median Price", color: "var(--series-1)" },
  { name: "Week Checkpoint", color: "var(--series-2)" },
  { name: "Month Checkpoint", color: "var(--series-3)" },
];

function PriceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: ChartRow }[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Day {label}</div>
      <div className="chart-tooltip-value">
        <span className="tooltip-line-key" style={{ background: "var(--series-1)" }} />
        Price: {formatCurrency(row.price)}
      </div>
      {row.weekIndex !== null && (
        <div className="chart-tooltip-value">
          <span className="tooltip-line-key" style={{ background: "var(--series-2)" }} />
          Week {row.weekIndex}: realized {formatPercent(row.weeklyReturnPercent as number)}
          {" · "}target {formatPercent(row.weeklyTargetReturnPercent as number)}
        </div>
      )}
      {row.monthIndex !== null && (
        <div className="chart-tooltip-value">
          <span className="tooltip-line-key" style={{ background: "var(--series-3)" }} />
          Month {row.monthIndex}: realized {formatPercent(row.monthlyReturnPercent as number)}
          {" · "}target {formatPercent(row.monthlyTargetReturnPercent as number)}
        </div>
      )}
    </div>
  );
}

function FanTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { payload: FanRow }[];
  label?: number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Day {label}</div>
      <div className="chart-tooltip-value">
        <span className="tooltip-line-key" style={{ background: "var(--series-1)" }} />
        Median: {formatCurrency(row.median)}
      </div>
      <div className="chart-tooltip-value">10th-90th percentile: {formatCurrency(row.p10)} - {formatCurrency(row.p90)}</div>
      <div className="chart-tooltip-value">25th-75th percentile: {formatCurrency(row.p25)} - {formatCurrency(row.p75)}</div>
      {row.weekIndex !== null && (
        <div className="chart-tooltip-value">
          <span className="tooltip-line-key" style={{ background: "var(--series-2)" }} />
          Week {row.weekIndex} median realized: {formatPercent(row.weekMedianReturnPercent as number)}
        </div>
      )}
      {row.monthIndex !== null && (
        <div className="chart-tooltip-value">
          <span className="tooltip-line-key" style={{ background: "var(--series-3)" }} />
          Month {row.monthIndex} median realized: {formatPercent(row.monthMedianReturnPercent as number)}
        </div>
      )}
      {row.sampled && (
        <div className="chart-tooltip-dates">Estimated from a random sample of paths at this scale.</div>
      )}
    </div>
  );
}

export function CombinedPriceChart({ steps, multiPath }: CombinedPriceChartProps) {
  if (multiPath && multiPath.summary.numberOfPaths > 1) {
    const weekIndexByDay = new Map(multiPath.weekBands.map((b) => [b.day, b]));
    const monthIndexByDay = new Map(multiPath.monthBands.map((b) => [b.day, b]));
    const anySampled = multiPath.dayBands.some((b) => b.sampled);

    const fanData: FanRow[] = multiPath.dayBands.map((b) => {
      const week = weekIndexByDay.get(b.day);
      const month = monthIndexByDay.get(b.day);
      return {
        day: b.day,
        p10: b.p10,
        p25: b.p25,
        median: b.median,
        p75: b.p75,
        p90: b.p90,
        sampled: b.sampled,
        weeklyMarker: week ? b.median : undefined,
        weekIndex: week ? week.index : null,
        weekMedianReturnPercent: week ? week.median : null,
        monthlyMarker: month ? b.median : undefined,
        monthIndex: month ? month.index : null,
        monthMedianReturnPercent: month ? month.median : null,
      };
    });

    return (
      <div className="chart-card">
        <div className="chart-card-header">
          <div className="chart-card-heading">
            <span className="chart-card-icon" aria-hidden="true">
              <MarketIcon size={16} />
            </span>
            <div>
              <h3>Simulated NIFTY Price ({multiPath.summary.numberOfPaths.toLocaleString("en-IN")} paths)</h3>
              <p className="chart-subtitle">
                One combined fan chart across every simulated path: the solid line is the median
                price, the darker band is the 25th-75th percentile range, and the lighter band is
                the 10th-90th percentile range.
              </p>
            </div>
          </div>
          <ChartLegend items={FAN_LEGEND_ITEMS} />
        </div>
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart data={fanData} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="var(--gridline)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--baseline)" }}
              tickLine={false}
              label={{ value: "Simulated Day", position: "bottom", offset: 8, fill: "var(--muted)" }}
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
                style: { textAnchor: "middle" },
              }}
            />
            <Tooltip content={<FanTooltip />} />
            <Area
              dataKey={(row: FanRow) => [row.p10, row.p90]}
              name="10th-90th percentile"
              stroke="none"
              fill="var(--series-1)"
              fillOpacity={0.14}
              isAnimationActive={false}
            />
            <Area
              dataKey={(row: FanRow) => [row.p25, row.p75]}
              name="25th-75th percentile"
              stroke="none"
              fill="var(--series-1)"
              fillOpacity={0.26}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="median"
              name="Median Price"
              stroke="var(--series-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
              isAnimationActive={false}
            />
            <Scatter dataKey="weeklyMarker" name="Weekly Adjustment" fill="var(--series-2)" />
            <Scatter dataKey="monthlyMarker" name="Monthly Adjustment" fill="var(--series-3)" />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="chart-footnote">
          Simulated paths — not a market forecast. Markers show week/month checkpoints (median
          across all paths).
          {anySampled && " Percentile bands are estimated from a random sample of paths at this scale."}
        </p>
      </div>
    );
  }

  const data: ChartRow[] = steps.map((s) => ({
    day: s.day,
    price: s.price,
    weeklyMarker: s.weekIndex !== null ? s.price : undefined,
    monthlyMarker: s.monthIndex !== null ? s.price : undefined,
    weeklyReturnPercent: s.weeklyReturnPercent,
    weeklyTargetReturnPercent: s.weeklyTargetReturnPercent,
    monthlyReturnPercent: s.monthlyReturnPercent,
    monthlyTargetReturnPercent: s.monthlyTargetReturnPercent,
    weekIndex: s.weekIndex,
    monthIndex: s.monthIndex,
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
              One combined price path — Daily returns move the price every day, while each week's
              and month's own Weekly/Monthly target return is spread evenly across that period's
              days, so all three constraints act continuously on the same trajectory. Checkpoints
              mark the end of each week/month with its realized vs. target return.
            </p>
          </div>
        </div>
        <ChartLegend items={LEGEND_ITEMS} />
      </div>
      <ResponsiveContainer width="100%" height={380}>
        <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            label={{
              value: "Simulated Day",
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
              style: { textAnchor: "middle" },
            }}
          />
          <Tooltip content={<PriceTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            name="Simulated Price"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--surface-1)" }}
            isAnimationActive={false}
          />
          <Scatter dataKey="weeklyMarker" name="Weekly Adjustment" fill="var(--series-2)" />
          <Scatter dataKey="monthlyMarker" name="Monthly Adjustment" fill="var(--series-3)" />
        </ComposedChart>
      </ResponsiveContainer>
      <p className="chart-footnote">
        Simulated path — not a market forecast. Markers show week/month checkpoints; hover for
        that period's realized vs. target return.
      </p>
    </div>
  );
}
