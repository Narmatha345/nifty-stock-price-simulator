import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { InputPanel } from "./components/InputPanel";
import { CombinedResultsTable } from "./components/CombinedResultsTable";
import { CombinedPriceChart } from "./components/CombinedPriceChart";
import { CombinedReturnDistributionChart } from "./components/CombinedReturnDistributionChart";
import { ThemeToggle } from "./components/ThemeToggle";
import { MarketIcon } from "./components/icons";
import { simulateCombinedNifty } from "./simulation/simulateNifty";
import type { MultiPathRequest, MultiPathResult, MultiPathWorkerMessage, SimulationParams } from "./simulation/types";
import MultiPathWorker from "./workers/multiPath.worker.ts?worker";
import {
  validateInputs,
  hasErrors,
  validateNumberOfPaths,
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
  numberOfPaths: "1",
  daily: DEFAULT_DAILY,
  weekly: DEFAULT_WEEKLY,
  monthly: DEFAULT_MONTHLY,
};

/** Paths * days above this shows a heads-up (not a block) that a run may take a while. */
const SCALE_WARNING_STEPS = 20_000_000;
/** Roughly observed cost per simulated step, for the estimate shown in that warning. */
const OBSERVED_SECONDS_PER_STEP = 3e-7;

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

function toAppliedParams(raw: RawInputs): AppliedParams {
  const startPrice = Number(raw.startPrice);
  return {
    daily: toPeriodParams(startPrice, raw.daily),
    weekly: toPeriodParams(startPrice, raw.weekly),
    monthly: toPeriodParams(startPrice, raw.monthly),
  };
}

function formatEstimatedTime(seconds: number): string {
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `~${minutes} min`;
  return `~${(minutes / 60).toFixed(1)} hours`;
}

function App() {
  const [rawInputs, setRawInputs] = useState<RawInputs>(DEFAULT_INPUTS);
  const [appliedParams, setAppliedParams] = useState<AppliedParams>(
    toAppliedParams(DEFAULT_INPUTS)
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [multiPathResult, setMultiPathResult] = useState<MultiPathResult | null>(null);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const errors = useMemo(() => validateInputs(rawInputs), [rawInputs]);
  const isValid = !hasErrors(errors);
  const requestedNumberOfPaths = Number(rawInputs.numberOfPaths);
  const isSinglePathRequested = Number.isFinite(requestedNumberOfPaths) && requestedNumberOfPaths === 1;

  useEffect(() => {
    if (!isValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setAppliedParams(toAppliedParams(rawInputs));
      // "1" behaves exactly as before, including live auto-run; anything
      // above that only (re)runs on an explicit Simulate click, so editing
      // inputs never silently kicks off a large background batch.
      if (isSinglePathRequested) {
        setMultiPathResult(null);
        setRunError(null);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [rawInputs, isValid, isSinglePathRequested]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleStartPriceChange = (value: string) => {
    setRawInputs((prev) => ({ ...prev, startPrice: value }));
  };

  const handleNumberOfPathsChange = (value: string) => {
    setRawInputs((prev) => ({ ...prev, numberOfPaths: value }));
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

  const handleCancel = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    setProgress(null);
  };

  const handleSimulateAll = () => {
    if (!isValid) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const applied = toAppliedParams(rawInputs);
    setAppliedParams(applied);
    setRunError(null);

    const numberOfPaths = Math.trunc(requestedNumberOfPaths);
    if (numberOfPaths === 1) {
      setMultiPathResult(null);
      return;
    }

    workerRef.current?.terminate();
    const worker = new MultiPathWorker();
    workerRef.current = worker;
    setProgress({ completed: 0, total: numberOfPaths });

    worker.onmessage = (event: MessageEvent<MultiPathWorkerMessage>) => {
      const message = event.data;
      if (message.type === "progress") {
        setProgress({ completed: message.completed, total: message.total });
      } else if (message.type === "done") {
        setMultiPathResult(message.result);
        setProgress(null);
        workerRef.current = null;
      } else if (message.type === "error") {
        setRunError(message.message);
        setProgress(null);
        workerRef.current = null;
      }
    };
    worker.onerror = (event) => {
      setRunError(event.message || "The simulation worker crashed unexpectedly.");
      setProgress(null);
      workerRef.current = null;
    };

    const request: MultiPathRequest = {
      daily: applied.daily,
      weekly: applied.weekly,
      monthly: applied.monthly,
      numberOfPaths,
    };
    worker.postMessage(request);
  };

  // Single combined run: the Daily/Weekly/Monthly inputs are three
  // constraints applied to the same price path, not three independent
  // simulations. This always stays available as the "Number of Simulations
  // = 1" view, and as the basis for viewing any one representative path out
  // of a multi-path batch (see CombinedResultsTable's path picker).
  const combinedResult = useMemo(
    () => simulateCombinedNifty(appliedParams.daily, appliedParams.weekly, appliedParams.monthly),
    [appliedParams.daily, appliedParams.weekly, appliedParams.monthly]
  );

  const scaleWarning = useMemo(() => {
    const paths = Number(rawInputs.numberOfPaths);
    const days = Number(rawInputs.daily.numberOfPeriods);
    if (!Number.isFinite(paths) || !Number.isFinite(days) || paths <= 1 || days <= 0) {
      return undefined;
    }
    const steps = paths * days;
    if (steps < SCALE_WARNING_STEPS) return undefined;
    const estimate = formatEstimatedTime(steps * OBSERVED_SECONDS_PER_STEP);
    return `This runs ${paths.toLocaleString("en-IN")} paths × ${days.toLocaleString("en-IN")} days ≈ ${steps.toLocaleString("en-IN")} steps — roughly ${estimate} depending on your device. You can cancel anytime once it starts.`;
  }, [rawInputs.numberOfPaths, rawInputs.daily.numberOfPeriods]);

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
          numberOfPaths={rawInputs.numberOfPaths}
          onNumberOfPathsChange={handleNumberOfPathsChange}
          numberOfPathsError={validateNumberOfPaths(rawInputs.numberOfPaths)}
          scaleWarning={scaleWarning}
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
          progress={progress}
          onCancel={handleCancel}
        />

        <div className="results">
          {runError && <p className="run-error-banner">Simulation failed: {runError}</p>}
          <CombinedPriceChart steps={combinedResult.steps} multiPath={multiPathResult} />
          <CombinedReturnDistributionChart
            dailyReturns={combinedResult.dailyReturns}
            multiPath={multiPathResult}
          />
          <CombinedResultsTable
            result={combinedResult}
            multiPath={multiPathResult}
            appliedParams={appliedParams}
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
