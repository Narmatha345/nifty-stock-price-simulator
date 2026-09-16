import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { InputPanel } from "./components/InputPanel";
import { SummaryCards } from "./components/SummaryCards";
import { PriceChart } from "./components/PriceChart";
import { DistributionChart } from "./components/DistributionChart";
import { DataTable } from "./components/DataTable";
import { ThemeToggle } from "./components/ThemeToggle";
import { MarketIcon } from "./components/icons";
import { simulateNifty } from "./simulation/simulateNifty";
import type { SimulationParams } from "./simulation/types";
import { validateInputs, hasErrors, type RawInputs } from "./simulation/validation";

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
        <InputPanel
          values={rawInputs}
          errors={errors}
          onChange={handleChange}
          onRun={handleRun}
        />

        <div className="results">
          <SummaryCards summary={result.summary} />
          <PriceChart days={result.days} />
          <DistributionChart
            meanDailyChangePercent={appliedParams.meanDailyChangePercent}
            dailyChangePercent={appliedParams.dailyChangePercent}
          />
          <DataTable days={result.days} />
        </div>
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
