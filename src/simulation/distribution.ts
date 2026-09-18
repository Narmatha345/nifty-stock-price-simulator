/** Probability density of a normal distribution: f(x) = 1/sqrt(2*pi*sigma^2) * exp(-(x-mu)^2 / (2*sigma^2)). */
export function normalPdf(x: number, mu: number, sigma: number): number {
  if (sigma <= 0) return 0;
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -((x - mu) * (x - mu)) / (2 * sigma * sigma);
  return coefficient * Math.exp(exponent);
}
