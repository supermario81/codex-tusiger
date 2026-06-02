import type { RunRecord } from "../types";

const keys = {
  runs: "tusiger.runs",
  activeRun: "tusiger.activeRun"
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const localStore = {
  readRuns: () => readJson<RunRecord[]>(keys.runs, []),
  upsertRun: (run: RunRecord) => {
    const runs = readJson<RunRecord[]>(keys.runs, []);
    const next = [run, ...runs.filter((item) => item.id !== run.id)];
    writeJson(keys.runs, next);
  },
  readActiveRun: () => readJson<RunRecord | null>(keys.activeRun, null),
  writeActiveRun: (run: RunRecord) => writeJson(keys.activeRun, run),
  clearActiveRun: () => localStorage.removeItem(keys.activeRun)
};
