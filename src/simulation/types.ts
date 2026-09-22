/** "daily" | "weekly" | "monthly" — identifies which of the three independent simulations a value belongs to. */
export type PeriodKind = "daily" | "weekly" | "monthly";

export interface SimulationParams {
  startPrice: number;
  meanReturnPercent: number;
  volatilityPercent: number;
  numberOfPeriods: number;
  seed: number;
}

export interface SimulationStep {
  /** 0 = starting price (before any simulated period has elapsed). */
  index: number;
  randomZ: number | null;
  returnPercent: number | null;
  price: number;
}

export interface SimulationSummary {
  startPrice: number;
  endPrice: number;
  highPrice: number;
  lowPrice: number;
  totalPercentChange: number;
  /** Empirical mean of the realized per-period returns (not the input mean). */
  meanReturnPercent: number;
  /** Empirical standard deviation of the realized per-period returns (not the input volatility). */
  volatilityPercent: number;
  observations: number;
}

export interface SimulationResult {
  steps: SimulationStep[];
  summary: SimulationSummary;
}

/**
 * One day of the single combined Daily+Weekly+Monthly price path. Every day
 * carries a `price` and a `dailyReturnPercent` that reflects the day's total
 * realized change (daily noise plus any active weekly/monthly contribution).
 * `weekIndex`/`monthIndex` mark the last day of each week/month (a
 * "checkpoint"), where the realized and target returns for that period are
 * also reported — see simulateCombinedNifty for why realized != target.
 */
export interface CombinedSimulationStep {
  /** 0 = starting price (before any simulated day has elapsed). */
  day: number;
  price: number;
  dailyReturnPercent: number | null;
  /** Realized compounded return (%) of the combined path over the just-completed week — includes daily/monthly influence too. Non-null only at a week checkpoint. */
  weeklyReturnPercent: number | null;
  /** The Weekly constraint's own drawn target return (%) for that week, in isolation — for comparison against weeklyReturnPercent. Non-null only at a week checkpoint. */
  weeklyTargetReturnPercent: number | null;
  /** Realized compounded return (%) of the combined path over the just-completed month — includes daily/weekly influence too. Non-null only at a month checkpoint. */
  monthlyReturnPercent: number | null;
  /** The Monthly constraint's own drawn target return (%) for that month, in isolation — for comparison against monthlyReturnPercent. Non-null only at a month checkpoint. */
  monthlyTargetReturnPercent: number | null;
  /** 1-based week number, set only alongside weeklyReturnPercent. */
  weekIndex: number | null;
  /** 1-based month number, set only alongside monthlyReturnPercent. */
  monthIndex: number | null;
}

export interface CombinedSimulationSummary {
  startPrice: number;
  endPrice: number;
  highPrice: number;
  lowPrice: number;
  totalPercentChange: number;
  totalDays: number;
  weeksApplied: number;
  monthsApplied: number;
}

export interface CombinedSimulationResult {
  steps: CombinedSimulationStep[];
  summary: CombinedSimulationSummary;
  /** Every day's realized daily return (%) — drives the Return Distribution chart. */
  dailyReturns: number[];
  /** Every applied weekly return (%), one per week boundary that landed within the horizon. */
  weeklyReturns: number[];
  /** Every applied monthly return (%), one per month boundary that landed within the horizon. */
  monthlyReturns: number[];
}
