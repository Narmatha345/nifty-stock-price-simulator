import type { AggregatedPeriod } from "../simulation/types";
import { PeriodChart } from "./PeriodChart";
import { PeriodSummaryCards } from "./PeriodSummaryCards";
import { PeriodTable } from "./PeriodTable";
import { ReturnDistributionSection } from "./ReturnDistributionSection";

interface WeeklyAnalysisProps {
  periods: AggregatedPeriod[];
  /** Weekly returns (%) across every simulated scenario, for the distribution chart. */
  scenarioReturns: number[];
  scenarioCount: number;
  baseSeed: number;
  onConfigureScenarios: () => void;
}

export function WeeklyAnalysis({
  periods,
  scenarioReturns,
  scenarioCount,
  baseSeed,
  onConfigureScenarios,
}: WeeklyAnalysisProps) {
  if (periods.length === 0) {
    return (
      <div className="results">
        <div className="panel empty-state">
          <p>Not enough simulated days for weekly analysis.</p>
          <p className="chart-footnote">7 simulated days grouped into one week.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results">
      <p className="section-intro">7 simulated days grouped into one week.</p>
      <PeriodSummaryCards periods={periods} periodLabel="Weekly" periodLabelPlural="Weeks" />
      <p className="disclaimer-line">Simulation-based analysis — not a market forecast.</p>
      <PeriodChart
        title="Weekly NIFTY Price"
        subtitle="Ending price for each completed week, from the same daily simulation."
        periods={periods}
        periodLabel="Week"
      />
      <p className="section-divider">Return Distribution</p>
      <ReturnDistributionSection
        periodLabel="Week"
        returns={scenarioReturns}
        scenarioCount={scenarioCount}
        baseSeed={baseSeed}
        onConfigureScenarios={onConfigureScenarios}
      />
      <PeriodTable
        title="Weekly Simulation Table"
        subtitle="Start price, end price, and return for each completed week."
        periods={periods}
        periodLabel="Week"
      />
    </div>
  );
}
