import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { InputPanel } from "./components/InputPanel";
import { SummaryCards } from "./components/SummaryCards";
import { PriceChart } from "./components/PriceChart";
import { DistributionChart } from "./components/DistributionChart";
import { DataTable } from "./components/DataTable";
import { ThemeToggle } from "./components/ThemeToggle";
import { MarketIcon } from "./components/icons";
import { Tabs, type TabItem } from "./components/Tabs";
import { WeeklyAnalysis } from "./components/WeeklyAnalysis";
import { MonthlyAnalysis } from "./components/MonthlyAnalysis";
import { ConditionalProbabilityTab } from "./components/ConditionalProbabilityTab";
import { simulateNifty } from "./simulation/simulateNifty";
import { aggregateWeeklyData, aggregateMonthlyData } from "./simulation/aggregate";
import {
  DEFAULT_SCENARIOS,
  calculateConditionalProbability,
  runMultipleSimulations,
} from "./simulation/conditionalProbability";
import type { SimulationParams } from "./simulation/types";
import {
  validateInputs,
  hasErrors,
  validateScenarioCount,
  type RawInputs,
} from "./simulation/validation";

type AppTab = "daily" | "weekly" | "monthly" | "conditional";

const TABS: TabItem<AppTab>[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "conditional", label: "Conditional Probability" },
];

const DEFAULT_INPUTS: RawInputs = {
  startPrice: "25000",
  meanDailyChangePercent: "0",
  dailyChangePercent: "1",
  numberOfDays: "30",
  seed: "42",
};

function toParams(raw: RawInputs): SimulationParams {
  return {
    startPrice: Number(raw.startPrice),
    meanDailyChangePercent: Number(raw.meanDailyChangePercent),
    dailyChangePercent: Number(raw.dailyChangePercent),
    numberOfDays: Math.trunc(Number(raw.numberOfDays)),
    seed: Math.trunc(Number(raw.seed)),
  };
}

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("daily");
  const [rawInputs, setRawInputs] = useState<RawInputs>(DEFAULT_INPUTS);
  const [appliedParams, setAppliedParams] = useState<SimulationParams>(
    toParams(DEFAULT_INPUTS)
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errors = useMemo(() => validateInputs(rawInputs), [rawInputs]);
  const isValid = !hasErrors(errors);

  useEffect(() => {
    if (!isValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedParams(toParams(rawInputs));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawInputs, isValid]);

  const handleChange = (field: keyof RawInputs, value: string) => {
    setRawInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleRun = () => {
    if (!isValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAppliedParams(toParams(rawInputs));
  };

  const result = useMemo(() => simulateNifty(appliedParams), [appliedParams]);
  const weeklyPeriods = useMemo(() => aggregateWeeklyData(result.days), [result.days]);
  const monthlyPeriods = useMemo(() => aggregateMonthlyData(result.days), [result.days]);

  // --- Multi-scenario data, shared by Weekly/Monthly Return Distribution and
  // Conditional Probability so scenarios are generated exactly once (see
  // simulation/conditionalProbability.ts). Computed lazily: never touched
  // while only the Daily tab has been used, so Daily stays exactly as fast
  // as before regardless of scenario count / number of days chosen.
  const [scenarioRaw, setScenarioRaw] = useState(String(DEFAULT_SCENARIOS));
  const [appliedScenarioCount, setAppliedScenarioCount] = useState(DEFAULT_SCENARIOS);
  const scenarioDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scenarioError = validateScenarioCount(scenarioRaw);
  const isScenarioValid = !scenarioError;

  useEffect(() => {
    if (!isScenarioValid) return;
    if (scenarioDebounceRef.current) clearTimeout(scenarioDebounceRef.current);
    scenarioDebounceRef.current = setTimeout(() => {
      setAppliedScenarioCount(Math.trunc(Number(scenarioRaw)));
    }, 400);
    return () => {
      if (scenarioDebounceRef.current) clearTimeout(scenarioDebounceRef.current);
    };
  }, [scenarioRaw, isScenarioValid]);

  const handleRunScenarios = () => {
    if (!isScenarioValid) return;
    if (scenarioDebounceRef.current) clearTimeout(scenarioDebounceRef.current);
    setAppliedScenarioCount(Math.trunc(Number(scenarioRaw)));
  };

  const [hasRequestedScenarios, setHasRequestedScenarios] = useState(false);
  if (activeTab !== "daily" && !hasRequestedScenarios) {
    setHasRequestedScenarios(true);
  }

  const scenarioData = useMemo(() => {
    if (!hasRequestedScenarios) return null;
    return runMultipleSimulations(appliedParams, appliedScenarioCount);
  }, [hasRequestedScenarios, appliedParams, appliedScenarioCount]);

  const weeklyScenarioReturns = useMemo(
    () =>
      scenarioData
        ? scenarioData.weeklyPeriodsByScenario.flatMap((periods) =>
            periods.map((p) => p.returnPercent)
          )
        : [],
    [scenarioData]
  );
  const monthlyScenarioReturns = useMemo(
    () =>
      scenarioData
        ? scenarioData.monthlyPeriodsByScenario.flatMap((periods) =>
            periods.map((p) => p.returnPercent)
          )
        : [],
    [scenarioData]
  );

  const weeklyConditionalResult = useMemo(
    () => calculateConditionalProbability(scenarioData?.weeklyPeriodsByScenario ?? []),
    [scenarioData]
  );
  const monthlyConditionalResult = useMemo(
    () => calculateConditionalProbability(scenarioData?.monthlyPeriodsByScenario ?? []),
    [scenarioData]
  );

  const goToScenarioConfig = () => setActiveTab("conditional");

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-brand">
            <span className="brand-icon" aria-hidden="true">
              <MarketIcon size={22} />
            </span>
            <div>
              <h1>NIFTY Stock Price Simulator</h1>
              <p>Simulate NIFTY price movements using seeded random daily returns.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

        <InputPanel
          values={rawInputs}
          errors={errors}
          onChange={handleChange}
          onRun={handleRun}
        />

        {activeTab === "daily" && (
          <div className="results">
            <SummaryCards summary={result.summary} />
            <PriceChart days={result.days} />
            <DistributionChart
              meanDailyChangePercent={appliedParams.meanDailyChangePercent}
              dailyChangePercent={appliedParams.dailyChangePercent}
            />
            <DataTable days={result.days} />
          </div>
        )}

        {activeTab === "weekly" && (
          <WeeklyAnalysis
            periods={weeklyPeriods}
            scenarioReturns={weeklyScenarioReturns}
            scenarioCount={appliedScenarioCount}
            baseSeed={appliedParams.seed}
            onConfigureScenarios={goToScenarioConfig}
          />
        )}

        {activeTab === "monthly" && (
          <MonthlyAnalysis
            periods={monthlyPeriods}
            scenarioReturns={monthlyScenarioReturns}
            scenarioCount={appliedScenarioCount}
            baseSeed={appliedParams.seed}
            onConfigureScenarios={goToScenarioConfig}
          />
        )}

        {activeTab === "conditional" && (
          <ConditionalProbabilityTab
            baseSeed={appliedParams.seed}
            scenarioRaw={scenarioRaw}
            scenarioError={scenarioError}
            onScenarioRawChange={setScenarioRaw}
            onRunScenarios={handleRunScenarios}
            weeklyResult={weeklyConditionalResult}
            monthlyResult={monthlyConditionalResult}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Statistical simulation only — daily returns are drawn from a normal
          distribution and do not predict real NIFTY market movements.
        </p>
      </footer>
    </div>
  );
}

export default App;
