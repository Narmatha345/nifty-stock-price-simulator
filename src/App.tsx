import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { InputPanel } from "./components/InputPanel";
import { CombinedResultsTable } from "./components/CombinedResultsTable";
import { CombinedPriceChart } from "./components/CombinedPriceChart";
import { CombinedReturnDistributionChart } from "./components/CombinedReturnDistributionChart";
import { ExactReturnsTable } from "./components/ExactReturnsTable";
import { ThemeToggle } from "./components/ThemeToggle";
import { MarketIcon } from "./components/icons";
import { simulateNifty } from "./simulation/simulateNifty";
import type { SimulationParams, SimulationStep } from "./simulation/types";
import {
  validateInputs,
  hasErrors,
  validatePeriodInputs,
  validateStartPrice,
  type RawInputs,
  type RawPeriodInputs,
} from "./simulation/validation";

const DEFAULT_DAILY: RawPeriodInputs = {
  meanReturnPercent: "0",
  volatilityPercent: "1",
  numberOfPeriods: "30",
  seed: "42",
};

const DEFAULT_WEEKLY: RawPeriodInputs = {
  meanReturnPercent: "0.5",
  volatilityPercent: "2.5",
  numberOfPeriods: "12",
  seed: "42",
};

const DEFAULT_MONTHLY: RawPeriodInputs = {
  meanReturnPercent: "1.5",
  volatilityPercent: "5",
  numberOfPeriods: "12",
  seed: "42",
};

const DEFAULT_INPUTS: RawInputs = {
  startPrice: "25000",
  daily: DEFAULT_DAILY,
  weekly: DEFAULT_WEEKLY,
  monthly: DEFAULT_MONTHLY,
};

interface AppliedParams {
  daily: SimulationParams;
  weekly: SimulationParams;
  monthly: SimulationParams;
}

function toPeriodParams(startPrice: number, raw: RawPeriodInputs): SimulationParams {
  return {
    startPrice,
    meanReturnPercent: Number(raw.meanReturnPercent),
    volatilityPercent: Number(raw.volatilityPercent),
    numberOfPeriods: Math.trunc(Number(raw.numberOfPeriods)),
    seed: Math.trunc(Number(raw.seed)),
  };
}

function extractReturns(steps: SimulationStep[]): number[] {
  return steps
    .slice(1)
    .map((s) => s.returnPercent)
    .filter((r): r is number => r !== null);
}

function toAppliedParams(raw: RawInputs): AppliedParams {
  const startPrice = Number(raw.startPrice);
  return {
    daily: toPeriodParams(startPrice, raw.daily),
    weekly: toPeriodParams(startPrice, raw.weekly),
    monthly: toPeriodParams(startPrice, raw.monthly),
  };
}

function App() {
  const [rawInputs, setRawInputs] = useState<RawInputs>(DEFAULT_INPUTS);
  const [appliedParams, setAppliedParams] = useState<AppliedParams>(
    toAppliedParams(DEFAULT_INPUTS)
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const errors = useMemo(() => validateInputs(rawInputs), [rawInputs]);
  const isValid = !hasErrors(errors);

  useEffect(() => {
    if (!isValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedParams(toAppliedParams(rawInputs));
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawInputs, isValid]);

  const handleStartPriceChange = (value: string) => {
    setRawInputs((prev) => ({ ...prev, startPrice: value }));
  };

  const handleDailyChange = (field: keyof RawPeriodInputs, value: string) => {
    setRawInputs((prev) => ({ ...prev, daily: { ...prev.daily, [field]: value } }));
  };
  const handleWeeklyChange = (field: keyof RawPeriodInputs, value: string) => {
    setRawInputs((prev) => ({ ...prev, weekly: { ...prev.weekly, [field]: value } }));
  };
  const handleMonthlyChange = (field: keyof RawPeriodInputs, value: string) => {
    setRawInputs((prev) => ({ ...prev, monthly: { ...prev.monthly, [field]: value } }));
  };

  const handleSimulateAll = () => {
    if (!isValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setAppliedParams(toAppliedParams(rawInputs));
  };

  // Each simulation only recomputes when its own applied params change, so
  // editing Weekly inputs never re-runs Daily or Monthly.
  const dailyResult = useMemo(() => simulateNifty(appliedParams.daily), [appliedParams.daily]);
  const weeklyResult = useMemo(() => simulateNifty(appliedParams.weekly), [appliedParams.weekly]);
  const monthlyResult = useMemo(
    () => simulateNifty(appliedParams.monthly),
    [appliedParams.monthly]
  );

  const dailyReturns = useMemo(() => extractReturns(dailyResult.steps), [dailyResult.steps]);
  const weeklyReturns = useMemo(() => extractReturns(weeklyResult.steps), [weeklyResult.steps]);
  const monthlyReturns = useMemo(
    () => extractReturns(monthlyResult.steps),
    [monthlyResult.steps]
  );

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
              <p>Simulate NIFTY price movements using seeded random returns.</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="app-main">
        <InputPanel
          startPrice={rawInputs.startPrice}
          onStartPriceChange={handleStartPriceChange}
          startPriceError={validateStartPrice(rawInputs.startPrice)}
          daily={rawInputs.daily}
          dailyErrors={validatePeriodInputs(rawInputs.daily)}
          onDailyChange={handleDailyChange}
          weekly={rawInputs.weekly}
          weeklyErrors={validatePeriodInputs(rawInputs.weekly)}
          onWeeklyChange={handleWeeklyChange}
          monthly={rawInputs.monthly}
          monthlyErrors={validatePeriodInputs(rawInputs.monthly)}
          onMonthlyChange={handleMonthlyChange}
          onSimulateAll={handleSimulateAll}
        />

        <div className="results">
          <CombinedResultsTable
            daily={dailyResult.summary}
            weekly={weeklyResult.summary}
            monthly={monthlyResult.summary}
          />
          <CombinedPriceChart
            daily={dailyResult.steps}
            weekly={weeklyResult.steps}
            monthly={monthlyResult.steps}
          />
          <CombinedReturnDistributionChart
            dailyReturns={dailyReturns}
            weeklyReturns={weeklyReturns}
            monthlyReturns={monthlyReturns}
          />
          <ExactReturnsTable
            dailyReturns={dailyReturns}
            weeklyReturns={weeklyReturns}
            monthlyReturns={monthlyReturns}
          />
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Statistical simulation only — returns are drawn from a normal distribution and do not
          predict real NIFTY market movements.
        </p>
      </footer>
    </div>
  );
}

export default App;
