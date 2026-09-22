import type { CombinedSimulationResult } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { TableIcon } from "./icons";

interface CombinedResultsTableProps {
  result: CombinedSimulationResult;
}

function cellClass(value: number | null): string {
  if (value === null) return "";
  return value >= 0 ? "positive" : "negative";
}

function cellText(value: number | null): string {
  return value === null ? "—" : formatPercent(value);
}

export function CombinedResultsTable({ result }: CombinedResultsTableProps) {
  const { steps, summary } = result;
  const totalReturnClass = summary.totalPercentChange >= 0 ? "positive" : "negative";

  return (
    <div className="table-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <TableIcon size={16} />
        </span>
        <div>
          <h3>Simulation Results Table</h3>
          <p className="chart-subtitle">
            One row per simulated day of the combined path. Daily Return % is that day's total
            realized change; Weekly/Monthly Return % show the realized return at each week/month
            checkpoint (hover the checkpoint on the chart above for that period's isolated
            target).
          </p>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-item">
          <span className="stat-label">Starting Price</span>
          <span className="stat-value">{formatCurrency(summary.startPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ending Price</span>
          <span className="stat-value">{formatCurrency(summary.endPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Return</span>
          <span className={`stat-value ${totalReturnClass}`}>
            {formatPercent(summary.totalPercentChange)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Highest Price</span>
          <span className="stat-value">{formatCurrency(summary.highPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lowest Price</span>
          <span className="stat-value">{formatCurrency(summary.lowPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Days / Weeks / Months Applied</span>
          <span className="stat-value">
            {summary.totalDays} / {summary.weeksApplied} / {summary.monthsApplied}
          </span>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Price</th>
              <th>Daily Return %</th>
              <th>Weekly Return %</th>
              <th>Monthly Return %</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step) => (
              <tr
                key={step.day}
                className={
                  step.monthIndex !== null
                    ? "month-boundary-row"
                    : step.weekIndex !== null
                      ? "week-boundary-row"
                      : ""
                }
              >
                <td>
                  {step.day === 0
                    ? "Start"
                    : step.monthIndex !== null
                      ? `Day ${step.day} (Month ${step.monthIndex})`
                      : step.weekIndex !== null
                        ? `Day ${step.day} (Week ${step.weekIndex})`
                        : `Day ${step.day}`}
                </td>
                <td>{formatCurrency(step.price)}</td>
                <td className={cellClass(step.dailyReturnPercent)}>
                  {cellText(step.dailyReturnPercent)}
                </td>
                <td className={cellClass(step.weeklyReturnPercent)}>
                  {cellText(step.weeklyReturnPercent)}
                </td>
                <td className={cellClass(step.monthlyReturnPercent)}>
                  {cellText(step.monthlyReturnPercent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
