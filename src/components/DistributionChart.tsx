import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { generateDistributionCurve } from "../simulation/distribution";
import { ActivityIcon } from "./icons";

interface DistributionChartProps {
  meanDailyChangePercent: number;
  dailyChangePercent: number;
}

function DistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: { x: number } }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">Daily return: {point.x.toFixed(2)}%</div>
      <div className="chart-tooltip-value">
        <span className="tooltip-line-key dist-key" />
        density {payload[0].value.toFixed(4)}
      </div>
    </div>
  );
}

const sigmaLineStyle = { stroke: "var(--muted)", strokeDasharray: "3 3" };

export function DistributionChart({
  meanDailyChangePercent,
  dailyChangePercent,
}: DistributionChartProps) {
  const mu = meanDailyChangePercent;
  const sigma = dailyChangePercent;
  const data = generateDistributionCurve(mu, sigma);

  return (
    <div className="chart-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <ActivityIcon size={16} />
        </span>
        <div>
          <h3>Daily Return Distribution</h3>
          <p className="chart-subtitle">
            Normal distribution of simulated daily returns, centered at μ ={" "}
            {mu.toFixed(2)}% with σ = {sigma.toFixed(2)}%.
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 28, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="var(--gridline)" vertical={false} />
          <XAxis
            dataKey="x"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(v: number) => `${v.toFixed(1)}%`}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
            label={{
              value: "Daily Return (%)",
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
            tickFormatter={(v: number) => v.toFixed(2)}
          />
          <Tooltip content={<DistributionTooltip />} />
          <Area
            type="monotone"
            dataKey="y"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="var(--series-1)"
            fillOpacity={0.1}
            isAnimationActive={false}
          />
          <ReferenceLine x={mu} stroke="var(--text-secondary)" label={{ value: "Mean", position: "top", fill: "var(--text-secondary)", fontSize: 11 }} />
          <ReferenceLine x={mu + sigma} {...sigmaLineStyle} label={{ value: "+1σ", position: "top", fill: "var(--muted)", fontSize: 11 }} />
          <ReferenceLine x={mu - sigma} {...sigmaLineStyle} label={{ value: "-1σ", position: "top", fill: "var(--muted)", fontSize: 11 }} />
          <ReferenceLine x={mu + sigma * 2} {...sigmaLineStyle} label={{ value: "+2σ", position: "top", fill: "var(--muted)", fontSize: 11 }} />
          <ReferenceLine x={mu - sigma * 2} {...sigmaLineStyle} label={{ value: "-2σ", position: "top", fill: "var(--muted)", fontSize: 11 }} />
          <ReferenceLine x={mu + sigma * 3} {...sigmaLineStyle} label={{ value: "+3σ", position: "top", fill: "var(--muted)", fontSize: 11 }} />
          <ReferenceLine x={mu - sigma * 3} {...sigmaLineStyle} label={{ value: "-3σ", position: "top", fill: "var(--muted)", fontSize: 11 }} />
        </AreaChart>
      </ResponsiveContainer>
      <p className="chart-footnote">
        Probability distribution of daily returns — not the simulated price path.
      </p>
    </div>
  );
}
