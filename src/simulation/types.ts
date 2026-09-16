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
