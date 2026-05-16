import type { ChallengeConfig, HistoryItem, MotivationMessage, PublicRun } from "../lib/types";

export const defaultChallengeConfig: ChallengeConfig = {
  id: "tusiger-default",
  name: "Tusiger",
  totalSteps: 1000,
  startLat: 47.315206553,
  startLng: 7.886963657,
  startRadiusM: 25,
  endLat: 47.318954559,
  endLng: 7.882850574,
  endRadiusM: 35,
  expectedElevationGainM: 235,
  elevationValidMinM: 205,
  elevationValidMaxM: 265,
  elevationReviewMinM: 180,
  elevationReviewMaxM: 290,
  gpsAccuracyValidMaxM: 25,
  gpsAccuracyReviewMaxM: 45,
  minDurationSeconds: 240,
  maxDurationSeconds: 7200,
  publishNeedsReview: false,
  donationUrl: "https://example.org/spenden",
  active: true
};

export const motivationMessages: MotivationMessage[] = [
  { minSteps: 0, maxSteps: 200, intensity: 1, message: "Starker Start. Finde deinen Rhythmus." },
  { minSteps: 0, maxSteps: 200, intensity: 1, message: "Ruhig bleiben. Jeder Schritt zählt." },
  { minSteps: 200, maxSteps: 400, intensity: 2, message: "Dranbleiben. Du bist im Flow." },
  { minSteps: 200, maxSteps: 400, intensity: 2, message: "Stabil. Genau so weiter." },
  { minSteps: 400, maxSteps: 600, intensity: 3, message: "Halbzeit. Jetzt beginnt der echte Tusiger." },
  { minSteps: 400, maxSteps: 600, intensity: 3, message: "Du hast den Berg im Griff." },
  { minSteps: 600, maxSteps: 800, intensity: 4, message: "Nicht nachlassen. Du bist stärker als du denkst." },
  { minSteps: 600, maxSteps: 800, intensity: 4, message: "Jetzt zählt Fokus." },
  { minSteps: 800, maxSteps: 950, intensity: 5, message: "Letzte Meter. Alles geben." },
  { minSteps: 800, maxSteps: 950, intensity: 5, message: "Oben wartet deine Zeit." },
  { minSteps: 950, maxSteps: 1000, intensity: 6, message: "Finish. Zieh durch." },
  { minSteps: 950, maxSteps: 1000, intensity: 6, message: "Du hast es gleich geschafft." }
];

export const historyFallback: HistoryItem[] = [
  {
    id: "history-2021",
    sortOrder: 1,
    yearLabel: "2021",
    title: "Die Idee entsteht",
    body: "Eine Challenge unter Freunden wird zur Herzensmission."
  },
  {
    id: "history-2022",
    sortOrder: 2,
    yearLabel: "2022",
    title: "Gemeinschaft wächst",
    body: "Immer mehr Menschen finden zusammen und gehen gemeinsam den Weg."
  },
  {
    id: "history-today",
    sortOrder: 3,
    yearLabel: "Heute",
    title: "1000 Stufen. Jeden Tag.",
    body: "Tausende Schritte. Unzählige Geschichten. Ein Ziel: besser werden, zusammen."
  }
];

export const demoLeaderboard: PublicRun[] = [
  {
    id: "run-1",
    rank: 1,
    nickname: "TrailMax",
    avatarUrl: "",
    durationSeconds: 5027,
    date: "2026-05-16",
    status: "valid",
    isCurrentUser: false
  },
  {
    id: "run-2",
    rank: 2,
    nickname: "AlpineRunner",
    avatarUrl: "",
    durationSeconds: 5112,
    date: "2026-05-16",
    status: "valid",
    isCurrentUser: false
  },
  {
    id: "run-3",
    rank: 3,
    nickname: "BergFex",
    avatarUrl: "",
    durationSeconds: 5225,
    date: "2026-05-16",
    status: "valid",
    isCurrentUser: false
  },
  {
    id: "run-current",
    rank: 642,
    nickname: "Du",
    avatarUrl: "",
    durationSeconds: 9296,
    date: "2026-05-16",
    status: "valid",
    isCurrentUser: true
  },
  {
    id: "run-643",
    rank: 643,
    nickname: "WaldLäuferin",
    avatarUrl: "",
    durationSeconds: 9321,
    date: "2026-05-16",
    status: "valid",
    isCurrentUser: false
  }
];
