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
}

/**
 * Bins returns into equal-width buckets spanning [min, max] for a histogram.
 * This is the empirical distribution of the simulated returns — not a
 * theoretical curve.
 *
 * Pass `range` to bin against a shared [min, max] instead of this series'
 * own — e.g. so Daily/Weekly/Monthly histograms line up on the same x-axis
 * for a combined chart.
 */
export function buildHistogram(
  returns: number[],
  bucketCount = 22,
  range?: [number, number]
): HistogramBucket[] {
  if (returns.length === 0) return [];

  const min = range ? range[0] : Math.min(...returns);
  const max = range ? range[1] : Math.max(...returns);

  if (min === max) {
    return [{ rangeStart: min, rangeEnd: max, midpoint: min, count: returns.length }];
  }

  const width = (max - min) / bucketCount;
  const buckets: HistogramBucket[] = Array.from({ length: bucketCount }, (_, i) => {
    const rangeStart = min + i * width;
    const rangeEnd = rangeStart + width;
    return { rangeStart, rangeEnd, midpoint: (rangeStart + rangeEnd) / 2, count: 0 };
  });

  for (const r of returns) {
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor((r - min) / width)));
    buckets[index].count += 1;
  }

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
