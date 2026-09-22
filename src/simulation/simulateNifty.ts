import { createSeededNormalGenerator } from "./rng";
import { calculateReturnStats } from "./returnDistribution";
import type {
  CombinedSimulationResult,
  CombinedSimulationStep,
  SimulationParams,
  SimulationResult,
  SimulationStep,
} from "./types";

/** Smallest price the simulation will report; prevents zero/negative prices. */
export const MIN_SIMULATED_PRICE = 0.01;

/** Trading days treated as one week when laying the Weekly constraint onto the combined daily path. */
export const TRADING_DAYS_PER_WEEK = 5;
/** Trading days treated as one month when laying the Monthly constraint onto the combined daily path. */
export const TRADING_DAYS_PER_MONTH = 21;

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

/**
 * Runs ONE combined Nifty price path that carries the Daily, Weekly, and
 * Monthly inputs as three simultaneous constraints on the same trajectory,
 * instead of three independent price paths.
 *
 * The Daily inputs set the resolution and total length of the combined path
 * (`daily.numberOfPeriods` days) — every day compounds the day's own return,
 * reusing `simulateNifty()` for that base leg so the daily seed/mean/vol
 * drive the same day-by-day noise they always have.
 *
 * Layering Weekly/Monthly in as an occasional lump sum (e.g. only on day 5,
 * 10, 15...) would make them invisible most days and inject a raw, un-scaled
 * jump — not a real "weekly-scale" or "monthly-scale" influence. Instead,
 * each week draws ONE target return from its own seeded generator,
 * `R = weeklyMean + z * weeklyVolatility`, and that target is converted to
 * the exact daily compounding rate that reproduces it over the week:
 *
 *   dailyRateFromWeek = (1 + R) ^ (1 / TRADING_DAYS_PER_WEEK) - 1
 *
 * Compounding this rate for exactly `TRADING_DAYS_PER_WEEK` days multiplies
 * out to precisely `(1 + R)` — an exact decomposition, not an approximation
 * or an average. The same is done for Monthly over `TRADING_DAYS_PER_MONTH`
 * days. Every day's total move is then:
 *
 *   dayFactor = (1 + dailyReturn) * (1 + dailyRateFromWeek) * (1 + dailyRateFromMonth)
 *
 * so all three constraints act on every single day, continuously, rather
 * than in periodic lumps — while each constraint's own random draw still
 * comes from, and is fully reconstructable from, its own seed.
 *
 * Mathematical limitation (unavoidable, not a bug): because Daily and
 * Monthly are also actively moving the price during any given week (and
 * vice versa), the combined path's REALIZED week-over-week or
 * month-over-month change will generally differ from that period's own
 * isolated target `R`. No formula can make three independently-specified,
 * simultaneously-active constraints exactly reproduce each other's isolated
 * target on one shared path — that's only possible if the targets were
 * mathematically derived from each other (e.g. weeklyMean = 5 * dailyMean),
 * which would defeat the point of giving three independent inputs. To keep
 * this auditable, each step reports BOTH figures at week/month checkpoints:
 * `weeklyReturnPercent`/`monthlyReturnPercent` (what the combined path
 * actually realized over that period) and `weeklyTargetReturnPercent`/
 * `monthlyTargetReturnPercent` (that period's own isolated drawn target).
 */
export function simulateCombinedNifty(
  daily: SimulationParams,
  weekly: SimulationParams,
  monthly: SimulationParams
): CombinedSimulationResult {
  const dailyRun = simulateNifty(daily);
  const totalDays = daily.numberOfPeriods;
  const weeklyHorizonDays = weekly.numberOfPeriods * TRADING_DAYS_PER_WEEK;
  const monthlyHorizonDays = monthly.numberOfPeriods * TRADING_DAYS_PER_MONTH;

  const nextWeeklyNormal = createSeededNormalGenerator(weekly.seed);
  const nextMonthlyNormal = createSeededNormalGenerator(monthly.seed);
  const weeklyMean = weekly.meanReturnPercent / 100;
  const weeklyVolatility = weekly.volatilityPercent / 100;
  const monthlyMean = monthly.meanReturnPercent / 100;
  const monthlyVolatility = monthly.volatilityPercent / 100;

  const steps: CombinedSimulationStep[] = [
    {
      day: 0,
      price: daily.startPrice,
      dailyReturnPercent: null,
      weeklyReturnPercent: null,
      weeklyTargetReturnPercent: null,
      monthlyReturnPercent: null,
      monthlyTargetReturnPercent: null,
      weekIndex: null,
      monthIndex: null,
    },
  ];

  const dailyReturns: number[] = [];
  const weeklyReturns: number[] = [];
  const monthlyReturns: number[] = [];

  let price = daily.startPrice;

  // The per-day compounding rate implied by the current week's/month's own
  // drawn target, plus the state needed to report realized checkpoint
  // returns and to know when a new week/month starts.
  let currentWeekDailyRate = 0;
  let currentWeekTargetReturnPercent = 0;
  let currentWeekStartPrice = price;
  let currentWeekNumber = 0;

  let currentMonthDailyRate = 0;
  let currentMonthTargetReturnPercent = 0;
  let currentMonthStartPrice = price;
  let currentMonthNumber = 0;

  for (let day = 1; day <= totalDays; day++) {
    const weekActive = day <= weeklyHorizonDays;
    const monthActive = day <= monthlyHorizonDays;

    const weekNumber = Math.ceil(day / TRADING_DAYS_PER_WEEK);
    if (weekActive && weekNumber !== currentWeekNumber) {
      const weeklyReturn = weeklyMean + nextWeeklyNormal() * weeklyVolatility;
      currentWeekDailyRate = Math.pow(1 + weeklyReturn, 1 / TRADING_DAYS_PER_WEEK) - 1;
      currentWeekTargetReturnPercent = weeklyReturn * 100;
      currentWeekNumber = weekNumber;
      currentWeekStartPrice = price;
    }

    const monthNumber = Math.ceil(day / TRADING_DAYS_PER_MONTH);
    if (monthActive && monthNumber !== currentMonthNumber) {
      const monthlyReturn = monthlyMean + nextMonthlyNormal() * monthlyVolatility;
      currentMonthDailyRate = Math.pow(1 + monthlyReturn, 1 / TRADING_DAYS_PER_MONTH) - 1;
      currentMonthTargetReturnPercent = monthlyReturn * 100;
      currentMonthNumber = monthNumber;
      currentMonthStartPrice = price;
    }

    const dailyLegReturn = dailyRun.steps[day].returnPercent as number;
    const dayFactor =
      (1 + dailyLegReturn / 100) *
      (weekActive ? 1 + currentWeekDailyRate : 1) *
      (monthActive ? 1 + currentMonthDailyRate : 1);

    let newPrice = price * dayFactor;
    const dailyReturnPercent = (dayFactor - 1) * 100;
    if (!Number.isFinite(newPrice) || newPrice <= 0) {
      newPrice = MIN_SIMULATED_PRICE;
    }
    price = newPrice;
    dailyReturns.push(dailyReturnPercent);

    // A checkpoint fires on the last day of a week/month, or on the final
    // simulated day if the horizon (or total days) cuts that period short —
    // so a trailing partial week/month still reports its realized return.
    let weeklyReturnPercent: number | null = null;
    let weeklyTargetReturnPercent: number | null = null;
    let appliedWeekIndex: number | null = null;
    const isWeekCheckpoint = day % TRADING_DAYS_PER_WEEK === 0 || day === totalDays;
    if (weekActive && isWeekCheckpoint) {
      weeklyReturnPercent = ((price - currentWeekStartPrice) / currentWeekStartPrice) * 100;
      weeklyTargetReturnPercent = currentWeekTargetReturnPercent;
      appliedWeekIndex = weekNumber;
      weeklyReturns.push(weeklyReturnPercent);
    }

    let monthlyReturnPercent: number | null = null;
    let monthlyTargetReturnPercent: number | null = null;
    let appliedMonthIndex: number | null = null;
    const isMonthCheckpoint = day % TRADING_DAYS_PER_MONTH === 0 || day === totalDays;
    if (monthActive && isMonthCheckpoint) {
      monthlyReturnPercent = ((price - currentMonthStartPrice) / currentMonthStartPrice) * 100;
      monthlyTargetReturnPercent = currentMonthTargetReturnPercent;
      appliedMonthIndex = monthNumber;
      monthlyReturns.push(monthlyReturnPercent);
    }

    steps.push({
      day,
      price,
      dailyReturnPercent,
      weeklyReturnPercent,
      weeklyTargetReturnPercent,
      monthlyReturnPercent,
      monthlyTargetReturnPercent,
      weekIndex: appliedWeekIndex,
      monthIndex: appliedMonthIndex,
    });
  }

  const prices = steps.map((s) => s.price);
  const endPrice = prices[prices.length - 1];

  return {
    steps,
    summary: {
      startPrice: daily.startPrice,
      endPrice,
      highPrice: Math.max(...prices),
      lowPrice: Math.min(...prices),
      totalPercentChange: ((endPrice - daily.startPrice) / daily.startPrice) * 100,
      totalDays,
      weeksApplied: weeklyReturns.length,
      monthsApplied: monthlyReturns.length,
    },
    dailyReturns,
    weeklyReturns,
    monthlyReturns,
  };
}
