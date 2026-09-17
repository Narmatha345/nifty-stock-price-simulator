import type { ConditionalCell } from "../simulation/types";

interface ConditionalStatCardProps {
  /** e.g. "P(Next Week UP | Current Week UP)" */
  title: string;
  /** e.g. "Current Week UP" */
  currentLabel: string;
  /** e.g. "Next Week UP" */
  nextLabel: string;
  cell: ConditionalCell;
}

export function ConditionalStatCard({
  title,
  currentLabel,
  nextLabel,
  cell,
}: ConditionalStatCardProps) {
  const probabilityText =
    cell.probability === null ? "N/A" : `${cell.probability.toFixed(1)}%`;

  return (
    <div className="prob-stat-card">
      <p className="prob-stat-title">{title}</p>
      <dl className="prob-stat-breakdown">
        <div className="prob-stat-row">
          <dt>{currentLabel}</dt>
          <dd>{cell.observations.toLocaleString("en-IN")} simulated observations</dd>
        </div>
        <div className="prob-stat-row">
          <dt>{nextLabel}</dt>
          <dd>{cell.matchCount.toLocaleString("en-IN")}</dd>
        </div>
      </dl>
      <div className="prob-stat-result">
        <span>Conditional Probability</span>
        <span className="prob-stat-value">{probabilityText}</span>
      </div>
    </div>
  );
}
