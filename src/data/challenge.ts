import type { ChallengeConfig, HistoryItem, LegalPage, MotivationMessage, PublicRun } from "../lib/types";

export const defaultChallengeConfig: ChallengeConfig = {
  id: "tusiger-default",
  name: "Tusiger",
  totalSteps: 1150,
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
  donationUrl: "",
  active: true
};

export const motivationMessages: MotivationMessage[] = [
  { minSteps: 0, maxSteps: 100, intensity: 1, message: "Starker Start. Finde deinen Rhythmus." },
  { minSteps: 100, maxSteps: 200, intensity: 1, message: "Ruhig bleiben. Jeder Schritt zählt." },
  { minSteps: 200, maxSteps: 300, intensity: 2, message: "Dranbleiben. Du bist im Flow." },
  { minSteps: 300, maxSteps: 400, intensity: 2, message: "Stabil. Genau so weiter." },
  { minSteps: 400, maxSteps: 500, intensity: 3, message: "Du hast den Berg im Griff." },
  { minSteps: 500, maxSteps: 600, intensity: 3, message: "Halbzeit. Jetzt beginnt der echte Tusiger." },
  { minSteps: 600, maxSteps: 700, intensity: 4, message: "Nicht nachlassen. Du bist stärker als du denkst." },
  { minSteps: 700, maxSteps: 800, intensity: 4, message: "Jetzt zählt Fokus." },
  { minSteps: 800, maxSteps: 900, intensity: 5, message: "Letzte Meter rücken näher. Sauber weiter." },
  { minSteps: 900, maxSteps: 1000, intensity: 5, message: "Oben wartet deine Zeit." },
  { minSteps: 1000, maxSteps: 1100, intensity: 6, message: "Finish-Zone. Zieh durch." },
  { minSteps: 1100, maxSteps: 1151, intensity: 6, message: "Du hast es gleich geschafft." }
];

export const historyFallback: HistoryItem[] = [
  {
    id: "history-2021",
    slug: "1904",
    sortOrder: 1,
    yearLabel: "1904",
    title: "Inbetriebnahme",
    body: "Inbetriebnahme der Druckleitung und der Borntreppe."
  },
  {
    id: "history-2022",
    slug: "1960",
    sortOrder: 2,
    yearLabel: "1960",
    title: "Rückbau",
    body: "Rückbau der Druckleitung und beginnender Zerfall der Treppe."
  },
  {
    id: "history-1986",
    slug: "1986",
    sortOrder: 3,
    yearLabel: "1986",
    title: "Neuerstellung",
    body: "Neuerstellung des Stäglis durch den Aarburger Initianten Herbert Scheidegger, kurz «Born-Hörbi» genannt."
  },
  {
    id: "history-1987-open",
    slug: "1987",
    sortOrder: 4,
    yearLabel: "1987",
    title: "Eröffnung",
    body: "Eröffnung des Stäglis, heute 1150 Stufen."
  },
  {
    id: "history-1987-care",
    slug: "1987-unterhalt",
    sortOrder: 5,
    yearLabel: "1987",
    title: "Unterhalt durch Freiwillige",
    body: "Beginn mit dem Unterhalt durch Freiwillige."
  }
];

export const legalFallback: LegalPage[] = [
  {
    id: "privacy-de",
    slug: "datenschutz",
    language: "de",
    title: "Datenschutzrichtlinie",
    version: "draft-legal-review-required",
    active: true,
    body: "Entwurf, rechtlich zu prüfen. Betreiber: Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Schweiz, mario@seven-art.com. Die App verarbeitet E-Mail zur Anmeldung, öffentliche Profilangaben, GPS-Punkte während aktiver Läufe, Gruppenmitgliedschaften und erste eigene Analytics-Events. E-Mail-Adressen werden nicht öffentlich angezeigt."
  },
  {
    id: "terms-de",
    slug: "nutzungsbedingungen",
    language: "de",
    title: "Nutzungsbedingungen",
    version: "draft-legal-review-required",
    active: true,
    body: "Entwurf, rechtlich zu prüfen. Tusiger ist ein privates Herzprojekt. Die Nutzung erfolgt freiwillig. Sportliche Aktivitäten erfolgen auf eigene Verantwortung."
  },
  {
    id: "imprint-de",
    slug: "impressum",
    language: "de",
    title: "Impressum",
    version: "draft-legal-review-required",
    active: true,
    body: "Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Schweiz. E-Mail: mario@seven-art.com. Telefon: 076 572 20 81."
  },
  {
    id: "sensors-de",
    slug: "standort-sensoren",
    language: "de",
    title: "Standort- und Sensor-Einwilligung",
    version: "draft-legal-review-required",
    active: true,
    body: "Entwurf, rechtlich zu prüfen. Standortdaten werden erst nach Nutzeraktion im Pre-Run und während eines aktiven Laufs verwendet. Safari kann Höhenwerte ungenau oder gar nicht liefern."
  },
  {
    id: "privacy-en",
    slug: "datenschutz",
    language: "en",
    title: "Privacy Policy",
    version: "draft-legal-review-required",
    active: true,
    body: "Draft, legal review required. Operator: Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Switzerland, mario@seven-art.com. The app processes email for sign-in, public profile data, GPS points during active runs, group memberships and first-party analytics events. Email addresses are never shown publicly."
  },
  {
    id: "terms-en",
    slug: "nutzungsbedingungen",
    language: "en",
    title: "Terms of Use",
    version: "draft-legal-review-required",
    active: true,
    body: "Draft, legal review required. Tusiger is a private heart project. Use is voluntary. Sporting activity is at your own responsibility."
  },
  {
    id: "imprint-en",
    slug: "impressum",
    language: "en",
    title: "Imprint",
    version: "draft-legal-review-required",
    active: true,
    body: "Mario Martic / seven-art.com, Riedtalstrasse 14a, 4800 Zofingen, Switzerland. Email: mario@seven-art.com. Phone: 076 572 20 81."
  },
  {
    id: "sensors-en",
    slug: "standort-sensoren",
    language: "en",
    title: "Location and Sensor Consent",
    version: "draft-legal-review-required",
    active: true,
    body: "Draft, legal review required. Location data is only used after user action during the pre-run check and while a run is active. Safari may provide inaccurate altitude values or none at all."
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
