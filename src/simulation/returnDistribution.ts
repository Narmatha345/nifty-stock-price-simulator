import { normalPdf } from "./distribution";

export interface ReturnDistributionStats {
  count: number;
  mean: number;
  stdDev: number;
  positivePercent: number;
  negativePercent: number;
}

/** Empirical mean/stddev/sign-split of a set of period returns (%). */
export function calculateReturnStats(returns: number[]): ReturnDistributionStats | null {
  if (returns.length === 0) return null;

  const count = returns.length;
  const mean = returns.reduce((sum, r) => sum + r, 0) / count;
  const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / count;
  const stdDev = Math.sqrt(variance);
  const positiveCount = returns.filter((r) => r > 0).length;
  const negativeCount = returns.filter((r) => r < 0).length;

  return {
    count,
    mean,
    stdDev,
    positivePercent: (positiveCount / count) * 100,
    negativePercent: (negativeCount / count) * 100,
  };
}

export interface HistogramBucket {
  rangeStart: number;
  rangeEnd: number;
  midpoint: number;
  count: number;
  /** Labels for the values that landed in this bucket, in input order — populated only when `labels` is passed to buildHistogram. */
  labels: string[];
}

/**
 * Bins returns into equal-width buckets spanning [min, max] for a histogram.
 * This is the empirical distribution of the simulated returns — not a
 * theoretical curve.
 *
 * Pass `range` to bin against a shared [min, max] instead of this series'
 * own — e.g. so Daily/Weekly/Monthly histograms line up on the same x-axis
 * for a combined chart.
 *
 * Pass `labels` (same length/order as `returns`, e.g. a formatted date per
 * return) to also collect which labels landed in each bucket — lets a
 * tooltip show exactly which days produced a given return range.
 */
export function buildHistogram(
  returns: number[],
  bucketCount = 22,
  range?: [number, number],
  labels?: string[]
): HistogramBucket[] {
  if (returns.length === 0) return [];

  // Loop instead of Math.min(...returns)/Math.max(...returns): spreading a
  // huge array (e.g. 1,000,000 ending prices) into a function call blows the
  // engine's call-stack argument limit ("Maximum call stack size exceeded").
  let min: number;
  let max: number;
  if (range) {
    [min, max] = range;
  } else {
    min = returns[0];
    max = returns[0];
    for (const r of returns) {
      if (r < min) min = r;
      if (r > max) max = r;
    }
  }

  if (min === max) {
    return [
      { rangeStart: min, rangeEnd: max, midpoint: min, count: returns.length, labels: labels ? [...labels] : [] },
    ];
  }

  const width = (max - min) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const rangeStart = min + i * width;
    const rangeEnd = rangeStart + width;
    return { rangeStart, rangeEnd, midpoint: (rangeStart + rangeEnd) / 2, count: 0, labels: [] };
  });

  returns.forEach((r, i) => {
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((r - min) / width)));
    buckets[index].count += 1;
    if (labels) buckets[index].labels.push(labels[i]);
  });

  return buckets;
}

/**
 * Expected bucket frequency under a normal distribution fitted to the given
 * mean/stddev (i.e. the "Fitted Normal Curve" overlay) — converts probability
 * density to an expected count for the bucket width, for visual comparison
 * against the empirical histogram. Not a claim that returns are normal.
 */
export function fittedNormalFrequency(
  bucket: HistogramBucket,
  totalCount: number,
  mean: number,
  stdDev: number
): number {
  if (stdDev <= 0) return 0;
  const bucketWidth = bucket.rangeEnd - bucket.rangeStart;
  return normalPdf(bucket.midpoint, mean, stdDev) * totalCount * bucketWidth;
}
