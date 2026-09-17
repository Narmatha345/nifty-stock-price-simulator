import { aggregateMonthlyData, aggregateWeeklyData } from "./aggregate";
import { simulateNifty } from "./simulateNifty";
import type {
  AggregatedPeriod,
  ConditionalCell,
  ConditionalMatrix,
  ConditionalProbabilityResult,
  PeriodStatus,
  SimulationParams,
} from "./types";

export const MIN_SCENARIOS = 100;
export const MAX_SCENARIOS = 10000;
export const DEFAULT_SCENARIOS = 1000;

const STATUSES: PeriodStatus[] = ["UP", "DOWN", "FLAT"];

export interface MultiScenarioResult {
  weeklyPeriodsByScenario: AggregatedPeriod[][];
  monthlyPeriodsByScenario: AggregatedPeriod[][];
}

/**
 * Runs `scenarioCount` deterministic simulations off the same base params,
 * one per derived seed (baseSeed, baseSeed + 1, ...), reusing simulateNifty
 * so scenario generation never duplicates the daily random-walk logic.
 * Same params + same base seed + same scenario count always yields the same
 * scenario seeds and therefore identical aggregated results.
 */
export function runMultipleSimulations(
  baseParams: SimulationParams,
  scenarioCount: number
): MultiScenarioResult {
  const weeklyPeriodsByScenario: AggregatedPeriod[][] = [];
  const monthlyPeriodsByScenario: AggregatedPeriod[][] = [];

  for (let i = 0; i < scenarioCount; i++) {
    const scenarioResult = simulateNifty({ ...baseParams, seed: baseParams.seed + i });
    weeklyPeriodsByScenario.push(aggregateWeeklyData(scenarioResult.days));
    monthlyPeriodsByScenario.push(aggregateMonthlyData(scenarioResult.days));
  }

  return { weeklyPeriodsByScenario, monthlyPeriodsByScenario };
}

/**
 * Builds the current-period -> next-period conditional-probability matrix
 * from consecutive completed periods across every scenario.
 *
 * P(Next = next | Current = current) = count(current -> next) / count(current)
 *
 * Only periods that have a following completed period contribute an
 * observation, so each row's probabilities sum to ~100% (subject to
 * rounding) and zero-observation conditions surface as null (-> "N/A").
 */
export function calculateConditionalProbability(
  periodsByScenario: AggregatedPeriod[][]
): ConditionalProbabilityResult {
  const currentTotals: Record<PeriodStatus, number> = { UP: 0, DOWN: 0, FLAT: 0 };
  const transitionCounts: Record<PeriodStatus, Record<PeriodStatus, number>> = {
    UP: { UP: 0, DOWN: 0, FLAT: 0 },
    DOWN: { UP: 0, DOWN: 0, FLAT: 0 },
    FLAT: { UP: 0, DOWN: 0, FLAT: 0 },
  };

  let totalTransitions = 0;
  for (const periods of periodsByScenario) {
    for (let i = 0; i < periods.length - 1; i++) {
      const current = periods[i].status;
      const next = periods[i + 1].status;
      currentTotals[current] += 1;
      transitionCounts[current][next] += 1;
      totalTransitions += 1;
    }
  }

  const matrix = {} as ConditionalMatrix;
  for (const current of STATUSES) {
    const row = {} as Record<PeriodStatus, ConditionalCell>;
    const observations = currentTotals[current];
    for (const next of STATUSES) {
      const matchCount = transitionCounts[current][next];
      const cell: ConditionalCell = {
        observations,
        matchCount,
        probability: observations === 0 ? null : (matchCount / observations) * 100,
      };
      row[next] = cell;
    }
    matrix[current] = row;
  }

  return { matrix, totalTransitions };
}
