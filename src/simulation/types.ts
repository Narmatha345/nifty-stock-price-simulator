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
