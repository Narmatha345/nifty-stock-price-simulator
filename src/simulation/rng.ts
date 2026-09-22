/**
 * Deterministic PRNG (mulberry32) seeded from an integer. Same seed always
 * produces the same sequence of uniform values in [0, 1).
 */
function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a function that yields uniform [0, 1) values, seeded
 * deterministically — reuses the same mulberry32 PRNG as the normal
 * generator below, for anything that needs raw uniform draws (e.g. reservoir
 * sampling) rather than normally-distributed ones.
 */
export function createSeededUniformGenerator(seed: number): () => number {
  return mulberry32(seed);
}

/**
 * Returns a function that yields standard normal (mean 0, sd 1) values using
 * the Box-Muller transform, seeded deterministically. Box-Muller produces two
 * independent normal values per pair of uniform draws; the second is cached
 * so the sequence stays fixed regardless of how many values are requested
 * (required so extending "Number of Days" preserves the overlapping days).
 */
export function createSeededNormalGenerator(seed: number): () => number {
  const nextUniform = mulberry32(seed);
  let spare: number | null = null;

  return function nextNormal(): number {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }

    let u1 = nextUniform();
    // avoid log(0)
    while (u1 <= Number.EPSILON) {
      u1 = nextUniform();
    }
    const u2 = nextUniform();

    const magnitude = Math.sqrt(-2 * Math.log(u1));
    const angle = 2 * Math.PI * u2;
    const z0 = magnitude * Math.cos(angle);
    const z1 = magnitude * Math.sin(angle);

    spare = z1;
    return z0;
  };
}
