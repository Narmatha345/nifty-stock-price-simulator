import { createSeededNormalGenerator } from "./rng";
import type { SimulationParams, SimulationResult, SimulationDay } from "./types";

/** Smallest price the simulation will report; prevents zero/negative prices. */
export const MIN_SIMULATED_PRICE = 0.01;

/**
 * Runs a deterministic, seeded simulation of daily price movements.
 *
 * Reproducibility contract: the same params always produce the same output,
 * and the seeded normal generator is consumed strictly in day order so that
 * increasing numberOfDays preserves every previously generated day.
 */
export function simulateNifty({
  startPrice,
  meanDailyChangePercent,
  dailyChangePercent,
  numberOfDays,
  seed,
}: SimulationParams): SimulationResult {
  const nextNormal = createSeededNormalGenerator(seed);
  const dailyMean = meanDailyChangePercent / 100;
  const dailyVolatility = dailyChangePercent / 100;

  const days: SimulationDay[] = [
    { day: 0, randomZ: null, dailyReturnPercent: null, price: startPrice },
  ];

  let previousPrice = startPrice;
  for (let day = 1; day <= numberOfDays; day++) {
    const z = nextNormal();
    const dailyReturn = dailyMean + z * dailyVolatility;
    let price = previousPrice * (1 + dailyReturn);

    if (!Number.isFinite(price) || price <= 0) {
      price = MIN_SIMULATED_PRICE;
    }

    days.push({
      day,
      randomZ: z,
      dailyReturnPercent: dailyReturn * 100,
      price,
    });
    previousPrice = price;
  }

  const prices = days.map((d) => d.price);
  const endPrice = prices[prices.length - 1];

  return {
    days,
    summary: {
      startPrice,
      endPrice,
      highPrice: Math.max(...prices),
      lowPrice: Math.min(...prices),
      totalPercentChange: ((endPrice - startPrice) / startPrice) * 100,
    },
  };
}
