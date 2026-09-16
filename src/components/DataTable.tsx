import type { SimulationDay } from "../simulation/types";
import { formatCurrency, formatPercent, formatNumber } from "../utils/format";
import { TableIcon } from "./icons";

interface DataTableProps {
  days: SimulationDay[];
}

export function DataTable({ days }: DataTableProps) {
  return (
    <div className="table-card">
      <div className="chart-card-heading">
        <span className="chart-card-icon" aria-hidden="true">
          <TableIcon size={16} />
        </span>
        <div>
          <h3>Daily Simulation Table</h3>
          <p className="chart-subtitle">
            Same generated dataset that drives the chart above — day, seeded random Z,
            daily return, and resulting price.
          </p>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Random Z</th>
              <th>Daily Return %</th>
              <th>NIFTY Price</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.day}>
                <td>{d.day}</td>
                <td>{d.randomZ === null ? "—" : formatNumber(d.randomZ)}</td>
                <td
                  className={
                    d.dailyReturnPercent === null
                      ? ""
                      : d.dailyReturnPercent >= 0
                        ? "positive"
                        : "negative"
                  }
                >
                  {d.dailyReturnPercent === null ? "—" : formatPercent(d.dailyReturnPercent)}
                </td>
                <td>{formatCurrency(d.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
