import type { SimulationSummary } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { TableIcon } from "./icons";

interface CombinedResultsTableProps {
  daily: SimulationSummary;
  weekly: SimulationSummary;
  monthly: SimulationSummary;
}

interface Row {
  label: string;
  format: (s: SimulationSummary) => string;
  signed?: boolean;
}

const ROWS: Row[] = [
  { label: "Starting Price", format: (s) => formatCurrency(s.startPrice) },
  { label: "Ending Price", format: (s) => formatCurrency(s.endPrice) },
  { label: "Highest Price", format: (s) => formatCurrency(s.highPrice) },
  { label: "Lowest Price", format: (s) => formatCurrency(s.lowPrice) },
  { label: "Total Return (%)", format: (s) => formatPercent(s.totalPercentChange), signed: true },
  { label: "Mean Return", format: (s) => formatPercent(s.meanReturnPercent), signed: true },
  { label: "Volatility", format: (s) => formatPercent(s.volatilityPercent) },
  { label: "Number of Observations", format: (s) => s.observations.toLocaleString("en-IN") },
];

export function CombinedResultsTable({ daily, weekly, monthly }: CombinedResultsTableProps) {
  return (
    <div className="table-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <TableIcon size={16} />
        </span>
        <div>
          <h3>Results Table</h3>
          <p className="chart-subtitle">
            Daily, Weekly, and Monthly summary metrics side by side — each column from its own
            independent simulation run.
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table className="results-summary-table">
          <thead>
            <tr>
              <th></th>
              <th>Daily</th>
              <th>Weekly</th>
              <th>Monthly</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {[daily, weekly, monthly].map((summary, i) => {
                  const value = row.format(summary);
                  const cls = row.signed
                    ? value.startsWith("+")
                      ? "positive"
                      : value.startsWith("-")
                        ? "negative"
                        : ""
                    : "";
                  return (
                    <td key={i} className={cls}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
