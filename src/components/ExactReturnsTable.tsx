import { formatPercent } from "../utils/format";
import { TableIcon } from "./icons";

interface ExactReturnsTableProps {
  dailyReturns: number[];
  weeklyReturns: number[];
  monthlyReturns: number[];
}

function cellClass(value: number | undefined): string {
  if (value === undefined) return "";
  return value >= 0 ? "positive" : "negative";
}

function cellText(value: number | undefined): string {
  return value === undefined ? "—" : formatPercent(value);
}

export function ExactReturnsTable({
  dailyReturns,
  weeklyReturns,
  monthlyReturns,
}: ExactReturnsTableProps) {
  const rowCount = Math.max(dailyReturns.length, weeklyReturns.length, monthlyReturns.length);
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    period: i + 1,
    daily: dailyReturns[i],
    weekly: weeklyReturns[i],
    monthly: monthlyReturns[i],
  }));

  return (
    <div className="table-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <TableIcon size={16} />
        </span>
        <div>
          <h3>Exact Returns</h3>
          <p className="chart-subtitle">
            Every individual period's exact return % — the raw values behind the Return
            Distribution chart above.
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Daily Return %</th>
              <th>Weekly Return %</th>
              <th>Monthly Return %</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.period}>
                <td>{row.period}</td>
                <td className={cellClass(row.daily)}>{cellText(row.daily)}</td>
                <td className={cellClass(row.weekly)}>{cellText(row.weekly)}</td>
                <td className={cellClass(row.monthly)}>{cellText(row.monthly)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
