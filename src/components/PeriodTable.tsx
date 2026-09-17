import type { AggregatedPeriod } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { TableIcon } from "./icons";

interface PeriodTableProps {
  title: string;
  subtitle: string;
  periods: AggregatedPeriod[];
  /** "Week" or "Month" — used for the first column header. */
  periodLabel: string;
}

export function PeriodTable({ title, subtitle, periods, periodLabel }: PeriodTableProps) {
  return (
    <div className="table-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <TableIcon size={16} />
        </span>
        <div>
          <h3>{title}</h3>
          <p className="chart-subtitle">{subtitle}</p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="period-table">
          <thead>
            <tr>
              <th>{periodLabel}</th>
              <th>Start Price</th>
              <th>End Price</th>
              <th>Return %</th>
              <th>Highest</th>
              <th>Lowest</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.periodNumber}>
                <td>
                  {periodLabel} {p.periodNumber}
                </td>
                <td>{formatCurrency(p.startPrice)}</td>
                <td>{formatCurrency(p.endPrice)}</td>
                <td className={p.returnPercent >= 0 ? "positive" : "negative"}>
                  {formatPercent(p.returnPercent)}
                </td>
                <td>{formatCurrency(p.highPrice)}</td>
                <td>{formatCurrency(p.lowPrice)}</td>
                <td className={`status-cell status-${p.status.toLowerCase()}`}>
                  {p.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
