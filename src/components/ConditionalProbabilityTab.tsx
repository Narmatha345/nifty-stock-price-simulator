import {
  MAX_SCENARIOS,
  MIN_SCENARIOS,
  calculateConditionalProbability,
} from "../simulation/conditionalProbability";
import { ConditionalMatrixTable } from "./ConditionalMatrixTable";
import { ConditionalStatCard } from "./ConditionalStatCard";
import { HashIcon, PlayIcon, TargetIcon } from "./icons";

interface ConditionalProbabilityTabProps {
  baseSeed: number;
  scenarioRaw: string;
  scenarioError?: string;
  onScenarioRawChange: (value: string) => void;
  onRunScenarios: () => void;
  weeklyResult: ReturnType<typeof calculateConditionalProbability>;
  monthlyResult: ReturnType<typeof calculateConditionalProbability>;
}

export function ConditionalProbabilityTab({
  baseSeed,
  scenarioRaw,
  scenarioError,
  onScenarioRawChange,
  onRunScenarios,
  weeklyResult,
  monthlyResult,
}: ConditionalProbabilityTabProps) {
  return (
    <div className="results">
      <div className="panel scenario-panel">
        <div className="panel-heading">
          <span className="panel-heading-icon" aria-hidden="true">
            <HashIcon size={16} />
          </span>
          <h2>Scenario Configuration</h2>
        </div>
        <p className="section-intro">
          Simulation-based probability of the next period's outcome given the current
          period's outcome. Each scenario reruns the daily simulation with a deterministic
          seed derived from the Random Seed input, so results are reproducible. This same
          scenario data also powers the Weekly and Monthly Return Distribution charts.
        </p>
        <div className="scenario-controls">
          <div className="field">
            <label htmlFor="scenarioCount">
              <HashIcon size={14} className="field-icon" />
              Number of Scenarios
            </label>
            <input
              id="scenarioCount"
              type="number"
              inputMode="numeric"
              step="1"
              min={MIN_SCENARIOS}
              max={MAX_SCENARIOS}
              value={scenarioRaw}
              onChange={(e) => onScenarioRawChange(e.target.value)}
              aria-invalid={!!scenarioError}
            />
            <p className="field-hint">
              Allowed range: {MIN_SCENARIOS.toLocaleString("en-IN")}–
              {MAX_SCENARIOS.toLocaleString("en-IN")}. Base seed: {baseSeed} (from Random
              Seed). Scenario N uses seed {baseSeed} + (N − 1).
            </p>
            {scenarioError && <p className="field-error">{scenarioError}</p>}
          </div>
          <button type="button" className="run-button" onClick={onRunScenarios}>
            <PlayIcon size={16} />
            Run Scenarios
          </button>
        </div>
        <p className="chart-footnote">
          Large scenario counts and day counts may take a few seconds to compute. Scenario
          paths are only used internally — only aggregate probabilities and distributions are
          shown.
        </p>
      </div>

      <p className="section-divider">Conditional Probability</p>

      <ConditionalPeriodSection
        title="Weekly Conditional Probability"
        description="Probability of the next week's outcome given the current week's outcome, based on simulated scenarios."
        periodLabel="Week"
        result={weeklyResult}
        emptyMessage="Not enough simulated days for weekly conditional probability. At least 2 completed weeks (14+ simulated days) are required."
      />

      <ConditionalPeriodSection
        title="Monthly Conditional Probability"
        description="Probability of the next simulation month's outcome given the current simulation month's outcome, based on simulated scenarios."
        periodLabel="Month"
        result={monthlyResult}
        emptyMessage="Not enough simulated days for monthly conditional probability. At least 2 completed simulation months (60+ simulated days) are required."
      />

      <div className="panel explanation-panel">
        <div className="panel-heading">
          <span className="panel-heading-icon" aria-hidden="true">
            <TargetIcon size={16} />
          </span>
          <h2>How This Works</h2>
        </div>
        <p>
          Conditional probability measures the likelihood of a future simulated outcome
          when the current outcome is already known.
        </p>
        <p>
          If the current simulated week is UP, this section shows what percentage of
          simulated cases have an UP following week.
        </p>
        <p>
          This is calculated from simulated scenarios and should not be interpreted as a
          prediction of actual NIFTY returns.
        </p>
        <p className="disclaimer-line">Simulated results — not a market forecast.</p>
      </div>
    </div>
  );
}

interface ConditionalPeriodSectionProps {
  title: string;
  description: string;
  periodLabel: "Week" | "Month";
  result: ReturnType<typeof calculateConditionalProbability>;
  emptyMessage: string;
}

function ConditionalPeriodSection({
  title,
  description,
  periodLabel,
  result,
  emptyMessage,
}: ConditionalPeriodSectionProps) {
  if (result.totalTransitions === 0) {
    return (
      <div className="chart-card">
        <h3>{title}</h3>
        <p className="chart-subtitle">{description}</p>
        <p className="empty-state-text">{emptyMessage}</p>
      </div>
    );
  }

  const upGivenUp = result.matrix.UP.UP;
  const downGivenDown = result.matrix.DOWN.DOWN;
  const upGivenDown = result.matrix.DOWN.UP;

  return (
    <div className="chart-card">
      <h3>{title}</h3>
      <p className="chart-subtitle">{description}</p>

      <div className="prob-stat-grid">
        <ConditionalStatCard
          title={`P(Next ${periodLabel} UP | Current ${periodLabel} UP)`}
          currentLabel={`Current ${periodLabel} UP`}
          nextLabel={`Next ${periodLabel} UP`}
          cell={upGivenUp}
        />
        <ConditionalStatCard
          title={`P(Next ${periodLabel} DOWN | Current ${periodLabel} DOWN)`}
          currentLabel={`Current ${periodLabel} DOWN`}
          nextLabel={`Next ${periodLabel} DOWN`}
          cell={downGivenDown}
        />
        <ConditionalStatCard
          title={`P(Next ${periodLabel} UP | Current ${periodLabel} DOWN)`}
          currentLabel={`Current ${periodLabel} DOWN`}
          nextLabel={`Next ${periodLabel} UP`}
          cell={upGivenDown}
        />
      </div>

      <h4 className="matrix-heading">Full {periodLabel}-to-{periodLabel} Matrix</h4>
      <ConditionalMatrixTable matrix={result.matrix} periodLabel={periodLabel} />
      <p className="chart-footnote">
        {result.totalTransitions.toLocaleString("en-IN")} total current-to-next {periodLabel.toLowerCase()}{" "}
        transitions observed across simulated scenarios. Probability observed across
        simulated scenarios — not a prediction of actual NIFTY returns.
      </p>
    </div>
  );
}
