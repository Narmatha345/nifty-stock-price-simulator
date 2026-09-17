import type { AggregatedPeriod } from "../simulation/types";
import { PeriodChart } from "./PeriodChart";
import { PeriodSummaryCards } from "./PeriodSummaryCards";
import { PeriodTable } from "./PeriodTable";
import { ReturnDistributionSection } from "./ReturnDistributionSection";

interface MonthlyAnalysisProps {
  periods: AggregatedPeriod[];
  /** Monthly returns (%) across every simulated scenario, for the distribution chart. */
  scenarioReturns: number[];
  scenarioCount: number;
  baseSeed: number;
  onConfigureScenarios: () => void;
}

export function MonthlyAnalysis({
  periods,
  scenarioReturns,
  scenarioCount,
  baseSeed,
  onConfigureScenarios,
}: MonthlyAnalysisProps) {
  if (periods.length === 0) {
    return (
      <div className="results">
        <div className="panel empty-state">
          <p>Not enough simulated days for monthly analysis.</p>
          <p className="chart-footnote">30 simulated days grouped into one simulation month.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results">
      <p className="section-intro">
        30 simulated days grouped into one simulation month. Simulation Month = 30 simulated
        days (not a calendar month).
      </p>
      <PeriodSummaryCards periods={periods} periodLabel="Monthly" periodLabelPlural="Months" />
      <p className="disclaimer-line">Simulation-based analysis — not a market forecast.</p>
      <PeriodChart
        title="Monthly NIFTY Price"
        subtitle="Ending price for each completed simulation month, from the same daily simulation."
        periods={periods}
        periodLabel="Month"
      />
      <p className="section-divider">Return Distribution</p>
      <ReturnDistributionSection
        periodLabel="Month"
        returns={scenarioReturns}
        scenarioCount={scenarioCount}
        baseSeed={baseSeed}
        onConfigureScenarios={onConfigureScenarios}
      />
      <PeriodTable
        title="Monthly Simulation Table"
        subtitle="Start price, end price, and return for each completed simulation month."
        periods={periods}
        periodLabel="Month"
      />
    </div>
  );
}
