import type { RawInputs, ValidationErrors } from "../simulation/validation";
import {
  ActivityIcon,
  CalendarIcon,
  HashIcon,
  PlayIcon,
  RupeeIcon,
  TrendingUpIcon,
} from "./icons";

interface InputPanelProps {
  values: RawInputs;
  errors: ValidationErrors;
  onChange: (field: keyof RawInputs, value: string) => void;
  onRun: () => void;
}

export function InputPanel({ values, errors, onChange, onRun }: InputPanelProps) {
  return (
    <section className="panel input-panel" aria-label="Simulation inputs">
      <div className="panel-heading">
        <span className="panel-heading-icon" aria-hidden="true">
          <ActivityIcon size={16} />
        </span>
        <h2>Simulation Settings</h2>
      </div>

      <div className="field">
        <label htmlFor="startPrice">
          <RupeeIcon size={14} className="field-icon" />
          Start Stock Price (₹)
        </label>
        <input
          id="startPrice"
          type="number"
          inputMode="decimal"
          value={values.startPrice}
          onChange={(e) => onChange("startPrice", e.target.value)}
          aria-invalid={!!errors.startPrice}
        />
        {errors.startPrice && <p className="field-error">{errors.startPrice}</p>}
      </div>

      <div className="field">
        <label htmlFor="meanDailyChangePercent">
          <TrendingUpIcon size={14} className="field-icon" />
          Mean Daily Return (%)
        </label>
        <input
          id="meanDailyChangePercent"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={values.meanDailyChangePercent}
          onChange={(e) => onChange("meanDailyChangePercent", e.target.value)}
          aria-invalid={!!errors.meanDailyChangePercent}
        />
        <p className="field-hint">
          Mean (μ) of the simulated daily return distribution.
        </p>
        {errors.meanDailyChangePercent && (
          <p className="field-error">{errors.meanDailyChangePercent}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="dailyChangePercent">
          <ActivityIcon size={14} className="field-icon" />
          Daily Volatility (%)
        </label>
        <input
          id="dailyChangePercent"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={values.dailyChangePercent}
          onChange={(e) => onChange("dailyChangePercent", e.target.value)}
          aria-invalid={!!errors.dailyChangePercent}
        />
        <p className="field-hint">
          Standard deviation (σ) of the simulated daily return distribution.
        </p>
        {errors.dailyChangePercent && (
          <p className="field-error">{errors.dailyChangePercent}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="numberOfDays">
          <CalendarIcon size={14} className="field-icon" />
          Number of Days
        </label>
        <input
          id="numberOfDays"
          type="number"
          inputMode="numeric"
          step="1"
          value={values.numberOfDays}
          onChange={(e) => onChange("numberOfDays", e.target.value)}
          aria-invalid={!!errors.numberOfDays}
        />
        {errors.numberOfDays && <p className="field-error">{errors.numberOfDays}</p>}
      </div>

      <div className="field">
        <label htmlFor="seed">
          <HashIcon size={14} className="field-icon" />
          Random Seed
        </label>
        <input
          id="seed"
          type="number"
          inputMode="numeric"
          step="1"
          value={values.seed}
          onChange={(e) => onChange("seed", e.target.value)}
          aria-invalid={!!errors.seed}
        />
        <p className="field-hint">
          Seed controls the random sequence. Using the same seed reproduces the same
          simulation.
        </p>
        {errors.seed && <p className="field-error">{errors.seed}</p>}
      </div>

      <button type="button" className="run-button" onClick={onRun}>
        <PlayIcon size={16} />
        Simulate
      </button>
    </section>
  );
}
