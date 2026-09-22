/// <reference lib="webworker" />
import { runMultiPathSimulation } from "../simulation/multiPath";
import type { MultiPathRequest, MultiPathWorkerMessage } from "../simulation/types";

let cancelled = false;

self.onmessage = (event: MessageEvent<MultiPathRequest | { type: "cancel" }>) => {
  const data = event.data;
  if ("type" in data && data.type === "cancel") {
    cancelled = true;
    return;
  }

  cancelled = false;
  const request = data as MultiPathRequest;
  const start = performance.now();

  try {
    const result = runMultiPathSimulation({
      daily: request.daily,
      weekly: request.weekly,
      monthly: request.monthly,
      numberOfPaths: request.numberOfPaths,
      onProgress: (completed, total) => {
        const message: MultiPathWorkerMessage = { type: "progress", completed, total };
        self.postMessage(message);
      },
      shouldContinue: () => !cancelled,
    });

    if (result === null) {
      return; // cancelled mid-run
    }

    const message: MultiPathWorkerMessage = {
      type: "done",
      result,
      elapsedMs: performance.now() - start,
    };
    self.postMessage(message);
  } catch (err) {
    const message: MultiPathWorkerMessage = {
      type: "error",
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(message);
  }
};
