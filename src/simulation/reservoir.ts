import type { PercentileBand } from "./types";

/**
 * Fixed-capacity reservoir sample (Algorithm R) — a uniform random sample of
 * a stream whose length isn't known in advance, with memory bounded by
 * `capacity` no matter how many values are pushed. When the stream never
 * exceeds `capacity`, every value is kept and the sample is exact (no
 * eviction ever triggers) — so the same structure is exact for small
 * populations and a statistically-valid estimate for large ones.
 */
export class Reservoir {
  private readonly capacity: number;
  private readonly values: number[] = [];
  private seen = 0;

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
  }

  /** `nextUnit` must yield a fresh uniform [0,1) draw per call. */
  push(value: number, nextUnit: () => number): void {
    this.seen += 1;
    if (this.values.length < this.capacity) {
      this.values.push(value);
      return;
    }
    const j = Math.floor(nextUnit() * this.seen);
    if (j < this.capacity) {
      this.values[j] = value;
    }
  }

  /** True once more values have been pushed than fit in the reservoir — i.e. this is a sample, not the exact population. */
  get isSampled(): boolean {
    return this.seen > this.capacity;
  }

  toSortedArray(): number[] {
    return [...this.values].sort((a, b) => a - b);
  }
}

function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const weight = idx - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/** Builds a percentile summary from an already-sorted (ascending) array of samples. */
export function bandFromSorted(sorted: number[], sampled: boolean): PercentileBand {
  return {
    min: sorted[0],
    p10: percentileOf(sorted, 10),
    p25: percentileOf(sorted, 25),
    median: percentileOf(sorted, 50),
    p75: percentileOf(sorted, 75),
    p90: percentileOf(sorted, 90),
    max: sorted[sorted.length - 1],
    sampled,
  };
}
