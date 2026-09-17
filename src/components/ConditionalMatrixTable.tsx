import type { ConditionalMatrix, PeriodStatus } from "../simulation/types";

const STATUSES: PeriodStatus[] = ["UP", "DOWN", "FLAT"];

interface ConditionalMatrixTableProps {
  matrix: ConditionalMatrix;
  /** "Week" or "Month" — used in row/column headers. */
  periodLabel: string;
}

function formatProbability(value: number | null): string {
  return value === null ? "N/A" : `${value.toFixed(1)}%`;
}

export function ConditionalMatrixTable({ matrix, periodLabel }: ConditionalMatrixTableProps) {
  return (
    <div className="table-scroll">
      <table className="matrix-table">
        <thead>
          <tr>
            <th className="matrix-corner" aria-hidden="true" />
            <th colSpan={STATUSES.length} className="matrix-super-header">
              Next {periodLabel}
            </th>
          </tr>
          <tr>
            <th>Current {periodLabel}</th>
            {STATUSES.map((status) => (
              <th key={status}>{status}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STATUSES.map((current) => (
            <tr key={current}>
              <td className="matrix-row-label">{current}</td>
              {STATUSES.map((next) => {
                const cell = matrix[current][next];
                return (
                  <td
                    key={next}
                    className={`matrix-cell matrix-cell-${next.toLowerCase()}`}
                  >
                    {formatProbability(cell.probability)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
