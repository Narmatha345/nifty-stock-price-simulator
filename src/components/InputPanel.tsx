import type { PeriodValidationErrors, RawPeriodInputs } from "../simulation/validation";
import {
  ActivityIcon,
  CalendarIcon,
  HashIcon,
  LayersIcon,
  PlayIcon,
  RupeeIcon,
  TrendingUpIcon,
} from "./icons";

interface PeriodInputGroupProps {
  /** "Daily" | "Weekly" | "Monthly" */
  title: string;
  /** "day" | "week" | "month" — used to build field ids and unit text. */
  unit: string;
  values: RawPeriodInputs;
  errors: PeriodValidationErrors;
  onChange: (field: keyof RawPeriodInputs, value: string) => void;
}

function PeriodInputGroup({ title, unit, values, errors, onChange }: PeriodInputGroupProps) {
  const idPrefix = unit;

  return (
    <fieldset className="period-input-group">
      <legend>{title} Simulation</legend>

      <div className="field">
        <label htmlFor={`${idPrefix}-meanReturnPercent`}>
          <TrendingUpIcon size={14} className="field-icon" />
          {title} Mean Return (%)
        </label>
        <input
          id={`${idPrefix}-meanReturnPercent`}
          type="number"
          inputMode="decimal"
          step="0.1"
          value={values.meanReturnPercent}
          onChange={(e) => onChange("meanReturnPercent", e.target.value)}
          aria-invalid={!!errors.meanReturnPercent}
        />
        {errors.meanReturnPercent && <p className="field-error">{errors.meanReturnPercent}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-volatilityPercent`}>
          <ActivityIcon size={14} className="field-icon" />
          {title} Volatility (%)
        </label>
        <input
          id={`${idPrefix}-volatilityPercent`}
          type="number"
          inputMode="decimal"
          step="0.1"
          value={values.volatilityPercent}
          onChange={(e) => onChange("volatilityPercent", e.target.value)}
          aria-invalid={!!errors.volatilityPercent}
        />
        {errors.volatilityPercent && <p className="field-error">{errors.volatilityPercent}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-numberOfPeriods`}>
          <CalendarIcon size={14} className="field-icon" />
          Number of {title === "Daily" ? "Days" : title === "Weekly" ? "Weeks" : "Months"}
        </label>
        <input
          id={`${idPrefix}-numberOfPeriods`}
          type="number"
          inputMode="numeric"
          step="1"
          value={values.numberOfPeriods}
          onChange={(e) => onChange("numberOfPeriods", e.target.value)}
          aria-invalid={!!errors.numberOfPeriods}
        />
        {errors.numberOfPeriods && <p className="field-error">{errors.numberOfPeriods}</p>}
      </div>

      <div className="field">
        <label htmlFor={`${idPrefix}-seed`}>
          <HashIcon size={14} className="field-icon" />
          Random Seed
        </label>
        <input
          id={`${idPrefix}-seed`}
          type="number"
          inputMode="numeric"
          step="1"
          value={values.seed}
          onChange={(e) => onChange("seed", e.target.value)}
          aria-invalid={!!errors.seed}
        />
        {errors.seed && <p className="field-error">{errors.seed}</p>}
      </div>
    </fieldset>
  );
}

interface InputPanelProps {
  startPrice: string;
  onStartPriceChange: (value: string) => void;
  startPriceError?: string;

  numberOfPaths: string;
  onNumberOfPathsChange: (value: string) => void;
  numberOfPathsError?: string;
  /** Plain-language heads-up when paths * days is large enough that a run may take a while — not a blocking error. */
  scaleWarning?: string;

  daily: RawPeriodInputs;
  dailyErrors: PeriodValidationErrors;
  onDailyChange: (field: keyof RawPeriodInputs, value: string) => void;

  weekly: RawPeriodInputs;
  weeklyErrors: PeriodValidationErrors;
  onWeeklyChange: (field: keyof RawPeriodInputs, value: string) => void;

  monthly: RawPeriodInputs;
  monthlyErrors: PeriodValidationErrors;
  onMonthlyChange: (field: keyof RawPeriodInputs, value: string) => void;

  onSimulateAll: () => void;
  /** Set while a multi-path batch is running in the background worker. */
  progress: { completed: number; total: number } | null;
  onCancel: () => void;
}

export function InputPanel({
  startPrice,
  onStartPriceChange,
  startPriceError,
  numberOfPaths,
  onNumberOfPathsChange,
  numberOfPathsError,
  scaleWarning,
  daily,
  dailyErrors,
  onDailyChange,
  weekly,
  weeklyErrors,
  onWeeklyChange,
  monthly,
  monthlyErrors,
  onMonthlyChange,
  onSimulateAll,
  progress,
  onCancel,
}: InputPanelProps) {
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
          value={startPrice}
          onChange={(e) => onStartPriceChange(e.target.value)}
          aria-invalid={!!startPriceError}
        />
        <p className="field-hint">
          Used as the starting price for the single combined simulation below — Daily, Weekly, and
          Monthly inputs act as constraints on that one price path.
        </p>
        {startPriceError && <p className="field-error">{startPriceError}</p>}
      </div>

      <div className="field">
        <label htmlFor="numberOfPaths">
          <LayersIcon size={14} className="field-icon" />
          Number of Simulations
        </label>
        <input
          id="numberOfPaths"
          type="number"
          inputMode="numeric"
          step="1"
          min={1}
          value={numberOfPaths}
          onChange={(e) => onNumberOfPathsChange(e.target.value)}
          aria-invalid={!!numberOfPathsError}
        />
        <p className="field-hint">
          Runs this many independent price paths with the same inputs (up to 1,000,000). 1 shows
          the exact path as before; more shows a median line with a 10th-90th percentile range.
        </p>
        {numberOfPathsError && <p className="field-error">{numberOfPathsError}</p>}
        {!numberOfPathsError && scaleWarning && <p className="field-warning">{scaleWarning}</p>}
      </div>

      <div className="period-input-groups">
        <PeriodInputGroup
          title="Daily"
          unit="day"
          values={daily}
          errors={dailyErrors}
          onChange={onDailyChange}
        />
        <PeriodInputGroup
          title="Weekly"
          unit="week"
          values={weekly}
          errors={weeklyErrors}
          onChange={onWeeklyChange}
        />
        <PeriodInputGroup
          title="Monthly"
          unit="month"
          values={monthly}
          errors={monthlyErrors}
          onChange={onMonthlyChange}
        />
      </div>

      {progress ? (
        <div className="simulate-progress">
          <div className="simulate-progress-bar">
            <div
              className="simulate-progress-fill"
              style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
            />
          </div>
          <div className="simulate-progress-row">
            <span>
              Simulating path {progress.completed.toLocaleString("en-IN")} of{" "}
              {progress.total.toLocaleString("en-IN")}
            </span>
            <button type="button" className="cancel-button" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="run-button" onClick={onSimulateAll}>
          <PlayIcon size={16} />
          Simulate
        </button>
      )}
    </section>
  );
}
