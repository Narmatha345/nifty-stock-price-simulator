import type { AggregatedPeriod, PeriodStatus, SimulationDay } from "./types";

/** One simulated week = 7 simulated days. */
export const WEEK_LENGTH_DAYS = 7;
/** One "simulation month" = 30 simulated days (not a calendar month). */
export const MONTH_LENGTH_DAYS = 30;

export function classifyPeriod(returnPercent: number): PeriodStatus {
  if (returnPercent > 0) return "UP";
  if (returnPercent < 0) return "DOWN";
  return "FLAT";
}

/**
 * Groups daily simulation data into fixed-length periods (weeks/months) and
 * computes start/end/high/low/return for each *completed* period only.
 * Day 0 (the starting price) anchors period 1; a trailing partial period
 * (fewer than periodLengthDays remaining) is dropped, never padded.
 */
export function aggregatePeriods(
  days: SimulationDay[],
  periodLengthDays: number
): AggregatedPeriod[] {
  const totalSimulatedDays = days.length - 1; // excludes day 0 (starting price)
  const completedPeriods = Math.floor(totalSimulatedDays / periodLengthDays);

  const periods: AggregatedPeriod[] = [];
  for (let p = 0; p < completedPeriods; p++) {
    const startIndex = p * periodLengthDays;
    const endIndex = startIndex + periodLengthDays;
    const periodDays = days.slice(startIndex, endIndex + 1);

    const startPrice = days[startIndex].price;
    const endPrice = days[endIndex].price;
    const returnPercent = ((endPrice - startPrice) / startPrice) * 100;
    const prices = periodDays.map((d) => d.price);

    periods.push({
      periodNumber: p + 1,
      startPrice,
      endPrice,
      returnPercent,
      highPrice: Math.max(...prices),
      lowPrice: Math.min(...prices),
      status: classifyPeriod(returnPercent),
    });
  }

  return periods;
}

/** Groups the daily simulation dataset into completed 7-day weekly periods. */
export function aggregateWeeklyData(days: SimulationDay[]): AggregatedPeriod[] {
  return aggregatePeriods(days, WEEK_LENGTH_DAYS);
}

/** Groups the daily simulation dataset into completed 30-day simulation-month periods. */
export function aggregateMonthlyData(days: SimulationDay[]): AggregatedPeriod[] {
  return aggregatePeriods(days, MONTH_LENGTH_DAYS);
}
