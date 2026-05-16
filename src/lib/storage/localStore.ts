import type { Group, Profile, RunRecord } from "../types";

const keys = {
  profile: "tusiger.profile",
  runs: "tusiger.runs",
  activeRun: "tusiger.activeRun",
  groups: "tusiger.groups"
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
  readProfile: () => readJson<Profile | null>(keys.profile, null),
  writeProfile: (profile: Profile) => writeJson(keys.profile, profile),
  clearProfile: () => localStorage.removeItem(keys.profile),
  readRuns: () => readJson<RunRecord[]>(keys.runs, []),
  writeRuns: (runs: RunRecord[]) => writeJson(keys.runs, runs),
  upsertRun: (run: RunRecord) => {
    const runs = readJson<RunRecord[]>(keys.runs, []);
    const next = [run, ...runs.filter((item) => item.id !== run.id)];
    writeJson(keys.runs, next);
  },
  readActiveRun: () => readJson<RunRecord | null>(keys.activeRun, null),
  writeActiveRun: (run: RunRecord) => writeJson(keys.activeRun, run),
  clearActiveRun: () => localStorage.removeItem(keys.activeRun),
  readGroups: () =>
    readJson<Group[]>(keys.groups, [
      {
        id: "gipfelstuermer",
        name: "Gipfelstürmer",
        description: "Die schnelle Tusiger-Crew.",
        inviteCode: "GIPFEL",
        isPrivate: false,
        memberCount: 24,
        bestTimeSeconds: 768
      },
      {
        id: "waldlaeufer",
        name: "Waldläufer",
        description: "Ruhig, stark, gemeinsam.",
        inviteCode: "WALD",
        isPrivate: false,
        memberCount: 18,
        bestTimeSeconds: 937
      }
    ]),
  writeGroups: (groups: Group[]) => writeJson(keys.groups, groups)
};
