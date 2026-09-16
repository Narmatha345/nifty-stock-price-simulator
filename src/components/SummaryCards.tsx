import type { SimulationSummary } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import {
  FlagIcon,
  PercentIcon,
  RupeeIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "./icons";

interface SummaryCardsProps {
  summary: SimulationSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const isUp = summary.totalPercentChange >= 0;

  return (
    <section className="summary-cards" aria-label="Simulation summary">
      <div className="card">
        <span className="card-icon"><RupeeIcon size={15} /></span>
        <span className="card-label">Starting Price</span>
        <span className="card-value">{formatCurrency(summary.startPrice)}</span>
      </div>
      <div className="card">
        <span className="card-icon"><FlagIcon size={15} /></span>
        <span className="card-label">Ending Price</span>
        <span className="card-value">{formatCurrency(summary.endPrice)}</span>
      </div>
      <div className="card">
        <span className="card-icon"><TrendingUpIcon size={15} /></span>
        <span className="card-label">Highest Price</span>
        <span className="card-value">{formatCurrency(summary.highPrice)}</span>
      </div>
      <div className="card">
        <span className="card-icon"><TrendingDownIcon size={15} /></span>
        <span className="card-label">Lowest Price</span>
        <span className="card-value">{formatCurrency(summary.lowPrice)}</span>
      </div>
      <div className={`card ${isUp ? "card-positive" : "card-negative"}`}>
        <span className="card-icon"><PercentIcon size={15} /></span>
        <span className="card-label">Total Change</span>
        <span className="card-value">
          {isUp ? <TrendingUpIcon size={14} className="card-trend-icon" /> : <TrendingDownIcon size={14} className="card-trend-icon" />}
          {formatPercent(summary.totalPercentChange)}
        </span>
      </div>
    </section>
  );
}
