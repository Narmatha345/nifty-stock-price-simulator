import { calculateReturnStats } from "../simulation/returnDistribution";
import type { AggregatedPeriod } from "../simulation/types";
import { formatPercent } from "../utils/format";
import {
  ActivityIcon,
  FlagIcon,
  HashIcon,
  PercentIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "./icons";

interface PeriodSummaryCardsProps {
  periods: AggregatedPeriod[];
  /** "Week" or "Month" — used to build card labels. */
  periodLabel: string;
  periodLabelPlural: string;
}

export function PeriodSummaryCards({
  periods,
  periodLabel,
  periodLabelPlural,
}: PeriodSummaryCardsProps) {
  const returns = periods.map((p) => p.returnPercent);
  // Mean and volatility are the empirical mean/standard deviation of the
  // actual completed period returns — never derived by scaling the Daily
  // mean/volatility inputs.
  const stats = calculateReturnStats(returns);
  const meanReturn = stats?.mean ?? 0;
  const volatility = stats?.stdDev ?? 0;
  const highestReturn = Math.max(...returns);
  const lowestReturn = Math.min(...returns);
  const positiveCount = periods.filter((p) => p.status === "UP").length;
  const negativeCount = periods.filter((p) => p.status === "DOWN").length;

  return (
    <section className="summary-cards" aria-label={`${periodLabel} summary`}>
      <div className="card">
        <span className="card-icon"><HashIcon size={15} /></span>
        <span className="card-label">Number of {periodLabelPlural}</span>
        <span className="card-value">{periods.length}</span>
      </div>
      <div className="card">
        <span className="card-icon"><PercentIcon size={15} /></span>
        <span className="card-label">Mean {periodLabel} Return</span>
        <span className="card-value">{formatPercent(meanReturn)}</span>
      </div>
      <div className="card">
        <span className="card-icon"><ActivityIcon size={15} /></span>
        <span className="card-label">{periodLabel} Volatility</span>
        <span className="card-value">{formatPercent(volatility)}</span>
      </div>
      <div className="card card-positive">
        <span className="card-icon"><TrendingUpIcon size={15} /></span>
        <span className="card-label">Highest {periodLabel} Return</span>
        <span className="card-value">{formatPercent(highestReturn)}</span>
      </div>
      <div className="card card-negative">
        <span className="card-icon"><TrendingDownIcon size={15} /></span>
        <span className="card-label">Lowest {periodLabel} Return</span>
        <span className="card-value">{formatPercent(lowestReturn)}</span>
      </div>
      <div className="card card-positive">
        <span className="card-icon"><FlagIcon size={15} /></span>
        <span className="card-label">Positive {periodLabelPlural}</span>
        <span className="card-value">{positiveCount}</span>
      </div>
      <div className="card card-negative">
        <span className="card-icon"><FlagIcon size={15} /></span>
        <span className="card-label">Negative {periodLabelPlural}</span>
        <span className="card-value">{negativeCount}</span>
      </div>
    </section>
  );
}
