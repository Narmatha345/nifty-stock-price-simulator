import { simulateCombinedNifty, TRADING_DAYS_PER_WEEK, TRADING_DAYS_PER_MONTH } from "./simulateNifty";
import { createSeededUniformGenerator } from "./rng";
import { Reservoir, bandFromSorted } from "./reservoir";
import type {
  MultiPathCheckpointBand,
  MultiPathDayBand,
  MultiPathResult,
  SimulationParams,
} from "./types";

/**
 * Per-day/per-checkpoint reservoir capacity. At or below this many paths,
 * every value is kept exactly (see Reservoir) — above it, percentile bands
 * become statistically-sampled estimates, flagged via `sampled: true`.
 */
export const RESERVOIR_CAPACITY = 2000;

/**
 * Deterministic per-path seed: path 0 always reproduces `baseSeed` exactly,
 * so a single-path run (numberOfPaths = 1) is byte-identical to today's
 * behavior. Later paths are spread via a multiplicative hash constant.
 */
export function deriveSeed(baseSeed: number, pathIndex: number): number {
  return (baseSeed + pathIndex * 2654435761) | 0;
}

function computeCheckpointDays(totalDays: number, periodLength: number, horizonDays: number): number[] {
  const days: number[] = [];
  for (let day = 1; day <= totalDays; day++) {
    const active = day <= horizonDays;
    const isCheckpoint = day % periodLength === 0 || day === totalDays;
    if (active && isCheckpoint) days.push(day);
  }
  return days;
}

export interface RunMultiPathOptions {
  daily: SimulationParams;
  weekly: SimulationParams;
  monthly: SimulationParams;
  numberOfPaths: number;
  /** Called periodically with progress; not called for numberOfPaths small enough to finish instantly. */
  onProgress?: (completed: number, total: number) => void;
  /** Checked periodically; return false to abort early (e.g. worker cancellation). Returns null if aborted. */
  shouldContinue?: () => boolean;
}

/**
 * Runs `numberOfPaths` independent copies of the same combined Daily/Weekly/
 * Monthly simulation (each via the unmodified `simulateCombinedNifty`, just
 * with a distinct derived seed per path — see deriveSeed) and aggregates
 * them into percentile bands rather than keeping every path's full detail,
 * so memory stays bounded regardless of path count:
 *
 * - Each path's final price is kept exactly (cheap: one number per path),
 *   so the ending-price distribution and its percentiles are always exact.
 * - Each day's price across all paths is folded into a fixed-capacity
 *   reservoir (see RESERVOIR_CAPACITY) instead of being stored in full, so
 *   the per-day fan-chart bands use bounded memory (`days * capacity`)
 *   whether there are 10 or 1,000,000 paths. Reservoirs at or under capacity
 *   are exact; larger ones are unbiased random samples (flagged as such).
 * - A path's full step array is discarded immediately after its values are
 *   folded into the reservoirs — peak memory is roughly one path's data
 *   plus the fixed-size aggregation structures, not paths * days.
 */
export function runMultiPathSimulation({
  daily,
  weekly,
  monthly,
  numberOfPaths,
  onProgress,
  shouldContinue,
}: RunMultiPathOptions): MultiPathResult | null {
  const totalDays = daily.numberOfPeriods;
  const reservoirCapacity = Math.min(numberOfPaths, RESERVOIR_CAPACITY);
  const nextUnit = createSeededUniformGenerator(
    (daily.seed ^ weekly.seed ^ monthly.seed ^ numberOfPaths) | 0
  );

  const dayReservoirs: Reservoir[] = Array.from(
    { length: totalDays + 1 },
    () => new Reservoir(reservoirCapacity)
  );

  const weeklyHorizonDays = weekly.numberOfPeriods * TRADING_DAYS_PER_WEEK;
  const monthlyHorizonDays = monthly.numberOfPeriods * TRADING_DAYS_PER_MONTH;
  const weekCheckpointDays = computeCheckpointDays(totalDays, TRADING_DAYS_PER_WEEK, weeklyHorizonDays);
  const monthCheckpointDays = computeCheckpointDays(totalDays, TRADING_DAYS_PER_MONTH, monthlyHorizonDays);
  const weekReservoirs = weekCheckpointDays.map(() => new Reservoir(reservoirCapacity));
  const monthReservoirs = monthCheckpointDays.map(() => new Reservoir(reservoirCapacity));

  const endingPrices = new Array<number>(numberOfPaths);
  const progressEvery = Math.max(1, Math.floor(numberOfPaths / 200));

  for (let pathIndex = 0; pathIndex < numberOfPaths; pathIndex++) {
    if (shouldContinue && pathIndex % progressEvery === 0 && !shouldContinue()) {
      return null;
    }

    const pathDaily: SimulationParams = { ...daily, seed: deriveSeed(daily.seed, pathIndex) };
    const pathWeekly: SimulationParams = { ...weekly, seed: deriveSeed(weekly.seed, pathIndex) };
    const pathMonthly: SimulationParams = { ...monthly, seed: deriveSeed(monthly.seed, pathIndex) };

    const result = simulateCombinedNifty(pathDaily, pathWeekly, pathMonthly);

    for (const step of result.steps) {
      dayReservoirs[step.day].push(step.price, nextUnit);
      if (step.weekIndex !== null && step.weeklyReturnPercent !== null) {
        weekReservoirs[step.weekIndex - 1]?.push(step.weeklyReturnPercent, nextUnit);
      }
      if (step.monthIndex !== null && step.monthlyReturnPercent !== null) {
        monthReservoirs[step.monthIndex - 1]?.push(step.monthlyReturnPercent, nextUnit);
      }
    }

    endingPrices[pathIndex] = result.summary.endPrice;

    if (onProgress && (pathIndex % progressEvery === 0 || pathIndex === numberOfPaths - 1)) {
      onProgress(pathIndex + 1, numberOfPaths);
    }
  }

  const dayBands: MultiPathDayBand[] = dayReservoirs.map((reservoir, day) => ({
    day,
    ...bandFromSorted(reservoir.toSortedArray(), reservoir.isSampled),
  }));

  const weekBands: MultiPathCheckpointBand[] = weekCheckpointDays.map((day, i) => ({
    index: i + 1,
    day,
    ...bandFromSorted(weekReservoirs[i].toSortedArray(), weekReservoirs[i].isSampled),
  }));

  const monthBands: MultiPathCheckpointBand[] = monthCheckpointDays.map((day, i) => ({
    index: i + 1,
    day,
    ...bandFromSorted(monthReservoirs[i].toSortedArray(), monthReservoirs[i].isSampled),
  }));

  const sortedEndingPrices = [...endingPrices].sort((a, b) => a - b);
  const endPriceBand = bandFromSorted(sortedEndingPrices, false);
  const percentProfitable =
    (endingPrices.filter((p) => p > daily.startPrice).length / numberOfPaths) * 100;

  let bestPathIndex = 0;
  let worstPathIndex = 0;
  for (let i = 1; i < numberOfPaths; i++) {
    if (endingPrices[i] > endingPrices[bestPathIndex]) bestPathIndex = i;
    if (endingPrices[i] < endingPrices[worstPathIndex]) worstPathIndex = i;
  }
  let medianPathIndex = 0;
  let medianDistance = Infinity;
  for (let i = 0; i < numberOfPaths; i++) {
    const distance = Math.abs(endingPrices[i] - endPriceBand.median);
    if (distance < medianDistance) {
      medianDistance = distance;
      medianPathIndex = i;
    }
  }

  return {
    summary: {
      numberOfPaths,
      totalDays,
      startPrice: daily.startPrice,
      endPrice: endPriceBand,
      percentProfitable,
      medianPathIndex,
      bestPathIndex,
      worstPathIndex,
    },
    dayBands,
    weekBands,
    monthBands,
    endingPrices,
  };
}
