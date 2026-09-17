export interface SimulationParams {
  startPrice: number;
  meanDailyChangePercent: number;
  dailyChangePercent: number;
  numberOfDays: number;
  seed: number;
}

export interface SimulationDay {
  day: number;
  randomZ: number | null;
  dailyReturnPercent: number | null;
  price: number;
}

export interface SimulationSummary {
  startPrice: number;
  endPrice: number;
  highPrice: number;
  lowPrice: number;
  totalPercentChange: number;
}

export interface SimulationResult {
  days: SimulationDay[];
  summary: SimulationSummary;
}

export interface DistributionPoint {
  x: number;
  y: number;
}

/** Direction of a completed weekly/monthly period, derived from its return %. */
export type PeriodStatus = "UP" | "DOWN" | "FLAT";

/**
 * A completed weekly or monthly period aggregated from daily simulation data.
 * Shared shape for both Weekly and Monthly Analysis.
 */
export interface AggregatedPeriod {
  periodNumber: number;
  startPrice: number;
  endPrice: number;
  returnPercent: number;
  highPrice: number;
  lowPrice: number;
  status: PeriodStatus;
}

/** One cell of a conditional-probability matrix: current condition -> next condition. */
export interface ConditionalCell {
  /** Count of simulated periods observed with the current (row) condition. */
  observations: number;
  /** Count of those periods whose following period matched the next (column) condition. */
  matchCount: number;
  /** matchCount / observations as a percentage, or null when observations is 0 (display "N/A"). */
  probability: number | null;
}

/** Current condition (row) -> next condition (column) -> cell. */
export type ConditionalMatrix = Record<PeriodStatus, Record<PeriodStatus, ConditionalCell>>;

export interface ConditionalProbabilityResult {
  matrix: ConditionalMatrix;
  /** Total current->next period transitions observed across all scenarios. */
  totalTransitions: number;
}
