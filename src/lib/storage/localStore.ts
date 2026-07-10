import type { RunRecord } from "../types";

const keys = {
  runs: "tusiger.runs",
  activeRun: "tusiger.activeRun"
};

// Volle Punktdaten lokal nur für die jüngsten Läufe behalten, sonst läuft
// localStorage (~5 MB) nach wenigen kompletten Läufen à ~1000 Punkte voll.
const maxStoredRuns = 30;
const runsWithFullPoints = 5;

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

function compactRun(run: RunRecord): RunRecord {
  return {
    ...run,
    points: [],
    trackingSummary: run.trackingSummary
      ? { ...run.trackingSummary, telemetry: [] }
      : undefined
  };
}

function pruneRuns(runs: RunRecord[]): RunRecord[] {
  return runs
    .slice(0, maxStoredRuns)
    .map((run, index) => (index < runsWithFullPoints ? run : compactRun(run)));
}

export const localStore = {
  readRuns: () => readJson<RunRecord[]>(keys.runs, []),
  upsertRun: (run: RunRecord) => {
    const runs = readJson<RunRecord[]>(keys.runs, []);
    const next = pruneRuns([run, ...runs.filter((item) => item.id !== run.id)]);
    try {
      writeJson(keys.runs, next);
    } catch {
      // Speicher voll: alles außer dem neuen Lauf kompaktieren, dann notfalls
      // auch dessen Punkte opfern — ein Quota-Fehler darf das Speichern des
      // Ergebnisses nie zum Absturz bringen.
      try {
        writeJson(keys.runs, [next[0], ...next.slice(1).map(compactRun)]);
      } catch {
        try {
          writeJson(keys.runs, next.map(compactRun));
        } catch {
          // Lauf liegt zu diesem Zeitpunkt bereits in Supabase.
        }
      }
    }
  },
  readActiveRun: () => readJson<RunRecord | null>(keys.activeRun, null),
  writeActiveRun: (run: RunRecord) => {
    try {
      writeJson(keys.activeRun, run);
    } catch {
      // Speicher voll: zuerst ohne Telemetrie versuchen, dann mit gekürzten
      // Punkten (Start bleibt erhalten). Niemals eine Exception in den
      // Aufnahme-Loop werfen.
      try {
        writeJson(keys.activeRun, { ...run, trackingSummary: undefined });
      } catch {
        try {
          writeJson(keys.activeRun, {
            ...run,
            trackingSummary: undefined,
            points: [...run.points.slice(0, 20), ...run.points.slice(-200)]
          });
        } catch {
          // Aufzeichnung läuft im Speicher weiter; nur der Reload-Schutz fehlt.
        }
      }
    }
  },
  clearActiveRun: () => localStorage.removeItem(keys.activeRun)
};
