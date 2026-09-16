import type { DistributionPoint } from "./types";

/** Probability density of a normal distribution: f(x) = 1/sqrt(2*pi*sigma^2) * exp(-(x-mu)^2 / (2*sigma^2)). */
export function normalPdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -((x - mu) * (x - mu)) / (2 * sigma * sigma);
  return coefficient * Math.exp(exponent);
}

/**
 * Sample points along the normal PDF (mean = mu, sd = sigma) across
 * mu +/- 4 sigma, for plotting the daily-return distribution curve.
 */
export function generateDistributionCurve(
  mu: number,
  sigma: number,
  pointCount = 200
): DistributionPoint[] {
  const range = sigma * 4;
  const points: DistributionPoint[] = [];

  for (let i = 0; i <= pointCount; i++) {
    const x = mu - range + (2 * range * i) / pointCount;
    points.push({ x, y: normalPdf(x, mu, sigma) });
  }

  return points;
}

export function getSigmaMarkers(mu: number, sigma: number): number[] {
  return [
    mu - 3 * sigma,
    mu - 2 * sigma,
    mu - 1 * sigma,
    mu,
    mu + sigma,
    mu + 2 * sigma,
    mu + 3 * sigma,
  ];
}
