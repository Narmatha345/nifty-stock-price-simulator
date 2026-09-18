import { createSeededNormalGenerator } from "./rng";
import { calculateReturnStats } from "./returnDistribution";
import type { SimulationParams, SimulationResult, SimulationStep } from "./types";

/** Smallest price the simulation will report; prevents zero/negative prices. */
export const MIN_SIMULATED_PRICE = 0.01;

/**
 * Runs a deterministic, seeded simulation of period-over-period price
 * movements. Period-agnostic: the same function drives the Daily, Weekly,
 * and Monthly simulations — each call is fed that period's own mean
 * return, volatility, period count, and seed.
 *
 * Reproducibility contract: the same params always produce the same output,
 * and the seeded normal generator is consumed strictly in step order so that
 * increasing numberOfPeriods preserves every previously generated step.
 */
export function simulateNifty({
  startPrice,
  meanReturnPercent,
  volatilityPercent,
  numberOfPeriods,
  seed,
}: SimulationParams): SimulationResult {
  const nextNormal = createSeededNormalGenerator(seed);
  const mean = meanReturnPercent / 100;
  const volatility = volatilityPercent / 100;

  const steps: SimulationStep[] = [
    { index: 0, randomZ: null, returnPercent: null, price: startPrice },
  ];

  let previousPrice = startPrice;
  for (let i = 1; i <= numberOfPeriods; i++) {
    const z = nextNormal();
    const periodReturn = mean + z * volatility;
    let price = previousPrice * (1 + periodReturn);

    if (!Number.isFinite(price) || price <= 0) {
      price = MIN_SIMULATED_PRICE;
    }

    steps.push({
      index: i,
      randomZ: z,
      returnPercent: periodReturn * 100,
      price,
    });
    previousPrice = price;
  }

  const prices = steps.map((s) => s.price);
  const endPrice = prices[prices.length - 1];
  const realizedReturns = steps.slice(1).map((s) => s.returnPercent as number);
  const stats = calculateReturnStats(realizedReturns);

  return {
    steps,
    summary: {
      startPrice,
      endPrice,
      highPrice: Math.max(...prices),
      lowPrice: Math.min(...prices),
      totalPercentChange: ((endPrice - startPrice) / startPrice) * 100,
      meanReturnPercent: stats?.mean ?? 0,
      volatilityPercent: stats?.stdDev ?? 0,
      observations: stats?.count ?? 0,
    },
  };
}
