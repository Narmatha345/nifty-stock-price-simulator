import { MAX_SCENARIOS, MIN_SCENARIOS } from "./conditionalProbability";

export interface ValidationErrors {
  startPrice?: string;
  meanDailyChangePercent?: string;
  dailyChangePercent?: string;
  numberOfDays?: string;
  seed?: string;
}

export const MAX_DAILY_CHANGE_PERCENT = 20;
export const MAX_MEAN_DAILY_CHANGE_PERCENT = 20;
export const MAX_NUMBER_OF_DAYS = 5000;

export interface RawInputs {
  startPrice: string;
  meanDailyChangePercent: string;
  dailyChangePercent: string;
  numberOfDays: string;
  seed: string;
}

export function validateInputs(raw: RawInputs): ValidationErrors {
  const errors: ValidationErrors = {};

  const startPrice = Number(raw.startPrice);
  if (raw.startPrice.trim() === "" || Number.isNaN(startPrice)) {
    errors.startPrice = "Enter a valid number.";
  } else if (startPrice <= 0) {
    errors.startPrice = "Start price must be greater than 0.";
  }

  const meanDailyChangePercent = Number(raw.meanDailyChangePercent);
  if (
    raw.meanDailyChangePercent.trim() === "" ||
    Number.isNaN(meanDailyChangePercent)
  ) {
    errors.meanDailyChangePercent = "Enter a valid number.";
  } else if (Math.abs(meanDailyChangePercent) > MAX_MEAN_DAILY_CHANGE_PERCENT) {
    errors.meanDailyChangePercent = `Keep mean daily change within +/-${MAX_MEAN_DAILY_CHANGE_PERCENT}% for a realistic simulation.`;
  }

  const dailyChangePercent = Number(raw.dailyChangePercent);
  if (raw.dailyChangePercent.trim() === "" || Number.isNaN(dailyChangePercent)) {
    errors.dailyChangePercent = "Enter a valid number.";
  } else if (dailyChangePercent <= 0) {
    errors.dailyChangePercent = "Daily price change must be greater than 0%.";
  } else if (dailyChangePercent > MAX_DAILY_CHANGE_PERCENT) {
    errors.dailyChangePercent = `Keep daily price change at or below ${MAX_DAILY_CHANGE_PERCENT}% for a realistic simulation.`;
  }

  const numberOfDays = Number(raw.numberOfDays);
  if (raw.numberOfDays.trim() === "" || Number.isNaN(numberOfDays)) {
    errors.numberOfDays = "Enter a valid number.";
  } else if (!Number.isInteger(numberOfDays) || numberOfDays <= 0) {
    errors.numberOfDays = "Number of days must be a positive integer.";
  } else if (numberOfDays > MAX_NUMBER_OF_DAYS) {
    errors.numberOfDays = `Number of days must be at most ${MAX_NUMBER_OF_DAYS}.`;
  }

  const seed = Number(raw.seed);
  if (raw.seed.trim() === "" || Number.isNaN(seed)) {
    errors.seed = "Enter a valid integer.";
  } else if (!Number.isInteger(seed)) {
    errors.seed = "Seed must be a whole number.";
  }

  return errors;
}

export function hasErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Validates the "Number of Scenarios" input used by Conditional Probability. */
export function validateScenarioCount(raw: string): string | undefined {
  const value = Number(raw);
  if (raw.trim() === "" || Number.isNaN(value)) {
    return "Enter a valid number.";
  }
  if (!Number.isInteger(value)) {
    return "Number of scenarios must be a whole number.";
  }
  if (value < MIN_SCENARIOS || value > MAX_SCENARIOS) {
    return `Number of scenarios must be between ${MIN_SCENARIOS} and ${MAX_SCENARIOS}.`;
  }
  return undefined;
}
