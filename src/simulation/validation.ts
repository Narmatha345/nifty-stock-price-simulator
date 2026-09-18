export interface RawPeriodInputs {
  meanReturnPercent: string;
  volatilityPercent: string;
  numberOfPeriods: string;
  seed: string;
}

export interface RawInputs {
  startPrice: string;
  daily: RawPeriodInputs;
  weekly: RawPeriodInputs;
  monthly: RawPeriodInputs;
}

export interface PeriodValidationErrors {
  meanReturnPercent?: string;
  volatilityPercent?: string;
  numberOfPeriods?: string;
  seed?: string;
}

export interface ValidationErrors {
  startPrice?: string;
  daily: PeriodValidationErrors;
  weekly: PeriodValidationErrors;
  monthly: PeriodValidationErrors;
}

export const MAX_VOLATILITY_PERCENT = 20;
export const MAX_MEAN_RETURN_PERCENT = 20;
export const MAX_NUMBER_OF_PERIODS = 5000;

export function validateStartPrice(raw: string): string | undefined {
  const startPrice = Number(raw);
  if (raw.trim() === "" || Number.isNaN(startPrice)) {
    return "Enter a valid number.";
  }
  if (startPrice <= 0) {
    return "Start price must be greater than 0.";
  }
  return undefined;
}

/** Validates one period's inputs (Daily, Weekly, or Monthly all share the same shape and rules). */
export function validatePeriodInputs(raw: RawPeriodInputs): PeriodValidationErrors {
  const errors: PeriodValidationErrors = {};

  const meanReturnPercent = Number(raw.meanReturnPercent);
  if (raw.meanReturnPercent.trim() === "" || Number.isNaN(meanReturnPercent)) {
    errors.meanReturnPercent = "Enter a valid number.";
  } else if (Math.abs(meanReturnPercent) > MAX_MEAN_RETURN_PERCENT) {
    errors.meanReturnPercent = `Keep mean return within +/-${MAX_MEAN_RETURN_PERCENT}% for a realistic simulation.`;
  }

  const volatilityPercent = Number(raw.volatilityPercent);
  if (raw.volatilityPercent.trim() === "" || Number.isNaN(volatilityPercent)) {
    errors.volatilityPercent = "Enter a valid number.";
  } else if (volatilityPercent <= 0) {
    errors.volatilityPercent = "Volatility must be greater than 0%.";
  } else if (volatilityPercent > MAX_VOLATILITY_PERCENT) {
    errors.volatilityPercent = `Keep volatility at or below ${MAX_VOLATILITY_PERCENT}% for a realistic simulation.`;
  }

  const numberOfPeriods = Number(raw.numberOfPeriods);
  if (raw.numberOfPeriods.trim() === "" || Number.isNaN(numberOfPeriods)) {
    errors.numberOfPeriods = "Enter a valid number.";
  } else if (!Number.isInteger(numberOfPeriods) || numberOfPeriods <= 0) {
    errors.numberOfPeriods = "Must be a positive integer.";
  } else if (numberOfPeriods > MAX_NUMBER_OF_PERIODS) {
    errors.numberOfPeriods = `Must be at most ${MAX_NUMBER_OF_PERIODS}.`;
  }

  const seed = Number(raw.seed);
  if (raw.seed.trim() === "" || Number.isNaN(seed)) {
    errors.seed = "Enter a valid integer.";
  } else if (!Number.isInteger(seed)) {
    errors.seed = "Seed must be a whole number.";
  }

  return errors;
}

export function validateInputs(raw: RawInputs): ValidationErrors {
  return {
    startPrice: validateStartPrice(raw.startPrice),
    daily: validatePeriodInputs(raw.daily),
    weekly: validatePeriodInputs(raw.weekly),
    monthly: validatePeriodInputs(raw.monthly),
  };
}

export function hasPeriodErrors(errors: PeriodValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return (
    !!errors.startPrice ||
    hasPeriodErrors(errors.daily) ||
    hasPeriodErrors(errors.weekly) ||
    hasPeriodErrors(errors.monthly)
  );
}
