import { useMemo, useState } from "react";
import { deriveSeed } from "../simulation/multiPath";
import {
  simulateCombinedNifty,
  TRADING_DAYS_PER_MONTH,
  TRADING_DAYS_PER_WEEK,
} from "../simulation/simulateNifty";
import type { CombinedSimulationResult, MultiPathResult, SimulationParams } from "../simulation/types";
import { formatCurrency, formatPercent } from "../utils/format";
import { TableIcon } from "./icons";

/** Trailing N-day return (%) ending on `steps[index]`, or null if there isn't yet a full window of history. */
function rollingReturnPercent(steps: CombinedSimulationResult["steps"], index: number, windowDays: number): number | null {
  if (index < windowDays) return null;
  const startPrice = steps[index - windowDays].price;
  const endPrice = steps[index].price;
  return ((endPrice - startPrice) / startPrice) * 100;
}

interface AppliedParams {
  daily: SimulationParams;
  weekly: SimulationParams;
  monthly: SimulationParams;
}

interface CombinedResultsTableProps {
  result: CombinedSimulationResult;
  /** When set (and numberOfPaths > 1), shows aggregate stats plus a selectable representative path's detail instead of the single result. */
  multiPath: MultiPathResult | null;
  appliedParams: AppliedParams;
}

function cellClass(value: number | null): string {
  if (value === null) return "";
  return value >= 0 ? "positive" : "negative";
}

function cellText(value: number | null): string {
  return value === null ? "—" : formatPercent(value);
}

function ResultRows({ result }: { result: CombinedSimulationResult }) {
  return (
    <>
      {result.steps.map((step, index) => {
        const weeklyRolling = rollingReturnPercent(result.steps, index, TRADING_DAYS_PER_WEEK);
        const monthlyRolling = rollingReturnPercent(result.steps, index, TRADING_DAYS_PER_MONTH);
        return (
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
              {step.day === 0 ? "Start" : `Day ${step.day}`}
              {step.monthIndex !== null
                ? ` (Month ${step.monthIndex})`
                : step.weekIndex !== null
                  ? ` (Week ${step.weekIndex})`
                  : ""}
            </td>
            <td>{formatCurrency(step.price)}</td>
            <td className={cellClass(step.dailyReturnPercent)}>{cellText(step.dailyReturnPercent)}</td>
            <td className={cellClass(weeklyRolling)}>{cellText(weeklyRolling)}</td>
            <td className={cellClass(monthlyRolling)}>{cellText(monthlyRolling)}</td>
          </tr>
        );
      })}
    </>
  );
}

type PathPick = "median" | "best" | "worst" | "custom";

export function CombinedResultsTable({
  result,
  multiPath,
  appliedParams,
}: CombinedResultsTableProps) {
  const isMultiPath = !!multiPath && multiPath.summary.numberOfPaths > 1;

  const [pathPick, setPathPick] = useState<PathPick>("median");
  const [customPathNumber, setCustomPathNumber] = useState("1");

  const selectedPathIndex = useMemo(() => {
    if (!multiPath) return 0;
    if (pathPick === "median") return multiPath.summary.medianPathIndex;
    if (pathPick === "best") return multiPath.summary.bestPathIndex;
    if (pathPick === "worst") return multiPath.summary.worstPathIndex;
    const parsed = Math.trunc(Number(customPathNumber));
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(Math.max(parsed - 1, 0), multiPath.summary.numberOfPaths - 1);
  }, [multiPath, pathPick, customPathNumber]);

  const selectedPathResult = useMemo(() => {
    if (!isMultiPath) return null;
    const pathDaily: SimulationParams = {
      ...appliedParams.daily,
      seed: deriveSeed(appliedParams.daily.seed, selectedPathIndex),
    };
    const pathWeekly: SimulationParams = {
      ...appliedParams.weekly,
      seed: deriveSeed(appliedParams.weekly.seed, selectedPathIndex),
    };
    const pathMonthly: SimulationParams = {
      ...appliedParams.monthly,
      seed: deriveSeed(appliedParams.monthly.seed, selectedPathIndex),
    };
    return simulateCombinedNifty(pathDaily, pathWeekly, pathMonthly);
  }, [isMultiPath, appliedParams, selectedPathIndex]);

  if (isMultiPath && multiPath && selectedPathResult) {
    const { summary } = multiPath;
    return (
      <div className="table-card">
        <div className="chart-card-heading">
          <span className="chart-card-icon" aria-hidden="true">
            <TableIcon size={16} />
          </span>
          <div>
            <h3>Simulation Results Table ({summary.numberOfPaths.toLocaleString("en-IN")} paths)</h3>
            <p className="chart-subtitle">
              Aggregate statistics across every simulated path, plus the full day-by-day detail of
              one representative path you pick below.
            </p>
          </div>
        </div>

        <div className="stat-strip">
          <div className="stat-item">
            <span className="stat-label">Starting Price</span>
            <span className="stat-value">{formatCurrency(summary.startPrice)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Median Ending Price</span>
            <span className="stat-value">{formatCurrency(summary.endPrice.median)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">10th-90th Percentile</span>
            <span className="stat-value">
              {formatCurrency(summary.endPrice.p10)} - {formatCurrency(summary.endPrice.p90)}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Paths Ending Higher</span>
            <span className="stat-value positive">{Math.round(summary.percentProfitable)}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Number of Paths</span>
            <span className="stat-value">{summary.numberOfPaths.toLocaleString("en-IN")}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Simulated Days</span>
            <span className="stat-value">{summary.totalDays}</span>
          </div>
        </div>

        <div className="path-picker">
          <span className="path-picker-label">Representative path:</span>
          <div className="path-picker-buttons">
            <button
              type="button"
              className={pathPick === "median" ? "path-pick-active" : ""}
              onClick={() => setPathPick("median")}
            >
              Median
            </button>
            <button
              type="button"
              className={pathPick === "best" ? "path-pick-active" : ""}
              onClick={() => setPathPick("best")}
            >
              Best
            </button>
            <button
              type="button"
              className={pathPick === "worst" ? "path-pick-active" : ""}
              onClick={() => setPathPick("worst")}
            >
              Worst
            </button>
            <label className={`path-pick-custom ${pathPick === "custom" ? "path-pick-active" : ""}`}>
              Path #
              <input
                type="number"
                min={1}
                max={summary.numberOfPaths}
                value={pathPick === "custom" ? customPathNumber : String(selectedPathIndex + 1)}
                onChange={(e) => {
                  setCustomPathNumber(e.target.value);
                  setPathPick("custom");
                }}
              />
            </label>
          </div>
          <span className="path-picker-hint">
            Showing path #{selectedPathIndex + 1} of {summary.numberOfPaths.toLocaleString("en-IN")}{" "}
            (ending price {formatCurrency(selectedPathResult.summary.endPrice)})
          </span>
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
              <ResultRows result={selectedPathResult} />
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const totalReturnClass = result.summary.totalPercentChange >= 0 ? "positive" : "negative";

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
            realized change. Weekly/Monthly Return % are rolling trailing returns — the change
            over the last 5 (Weekly) or 21 (Monthly) simulated days ending on that row — shown
            once enough history exists. "(Week N)"/"(Month N)" still mark each calendar
            checkpoint (hover it on the chart above for that period's isolated target).
          </p>
        </div>
      </div>

      <div className="stat-strip">
        <div className="stat-item">
          <span className="stat-label">Starting Price</span>
          <span className="stat-value">{formatCurrency(result.summary.startPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ending Price</span>
          <span className="stat-value">{formatCurrency(result.summary.endPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Return</span>
          <span className={`stat-value ${totalReturnClass}`}>
            {formatPercent(result.summary.totalPercentChange)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Highest Price</span>
          <span className="stat-value">{formatCurrency(result.summary.highPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Lowest Price</span>
          <span className="stat-value">{formatCurrency(result.summary.lowPrice)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Days / Weeks / Months Applied</span>
          <span className="stat-value">
            {result.summary.totalDays} / {result.summary.weeksApplied} / {result.summary.monthsApplied}
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
            <ResultRows result={result} />
          </tbody>
        </table>
      </div>
    </div>
  );
}
