import type { ChallengeConfig, HistoryItem, LegalPage, MotivationMessage } from "../lib/types";

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

export interface RouteWaypoint {
  steps: number;
  lat: number;
  lng: number;
  altM: number;
}

// Routenmodell v2 (2026-07-15): abgeleitet aus der vollständigen realen
// Aufzeichnung vom 2026-07-14 (test/fixtures/run-2026-07-14.json, ±3–6 m
// Genauigkeit). Polyline: Douglas-Peucker (ε = 3 m) über den Roh-Track plus
// die 13 Kalibrier-Anker (fotografiert alle 100 Stufen) auf die Polyline
// projiziert. Steps: stückweise linear über die kumulative Routendistanz
// durch die Anker — flache Verbindungswege sind damit automatisch kodiert.
// Höhen: geglättete GPS-Höhe, Anker exakt auf Messwert.
// Verifikation im Replay: max. |Step-Fehler| an den Ankern 2,9; 0,00 % der
// Punkte > 10 m von der Route (Altmodell v1: bis 66 Steps Fehler, 6,4 %).
export const routeModelVersion = 2;

export const routeWaypoints: RouteWaypoint[] = [
  { steps: 0, lat: 47.315188, lng: 7.886946, altM: 425.5 },
  { steps: 100, lat: 47.315491, lng: 7.886578, altM: 446.9 },
  { steps: 113, lat: 47.315525, lng: 7.886536, altM: 448.9 },
  { steps: 142, lat: 47.315628, lng: 7.886507, altM: 458.2 },
  { steps: 200, lat: 47.315773, lng: 7.886283, altM: 467.3 },
  { steps: 208, lat: 47.315797, lng: 7.886245, altM: 468.3 },
  { steps: 250, lat: 47.315975, lng: 7.886111, altM: 477.5 },
  { steps: 300, lat: 47.316152, lng: 7.88589, altM: 489.0 },
  { steps: 339, lat: 47.31638, lng: 7.885606, altM: 501.1 },
  { steps: 391, lat: 47.31673, lng: 7.885306, altM: 510.0 },
  { steps: 400, lat: 47.316777, lng: 7.885233, altM: 516.3 },
  { steps: 442, lat: 47.316909, lng: 7.885027, altM: 525.1 },
  { steps: 500, lat: 47.317128, lng: 7.88482, altM: 536.7 },
  { steps: 579, lat: 47.317407, lng: 7.884558, altM: 548.3 },
  { steps: 600, lat: 47.317471, lng: 7.884472, altM: 554.2 },
  { steps: 670, lat: 47.317692, lng: 7.884176, altM: 572.2 },
  { steps: 694, lat: 47.31779, lng: 7.884125, altM: 566.5 },
  { steps: 700, lat: 47.317785, lng: 7.884091, altM: 565.5 },
  { steps: 707, lat: 47.317779, lng: 7.884056, altM: 567.1 },
  { steps: 800, lat: 47.318048, lng: 7.883782, altM: 593.3 },
  { steps: 863, lat: 47.318247, lng: 7.883578, altM: 611.1 },
  { steps: 900, lat: 47.318345, lng: 7.883424, altM: 614.6 },
  { steps: 946, lat: 47.318449, lng: 7.883262, altM: 624.3 },
  { steps: 959, lat: 47.318486, lng: 7.883292, altM: 624.7 },
  { steps: 1000, lat: 47.318603, lng: 7.883198, altM: 635.1 },
  { steps: 1016, lat: 47.318647, lng: 7.883162, altM: 636.4 },
  { steps: 1100, lat: 47.318845, lng: 7.882926, altM: 654.8 },
  { steps: 1150, lat: 47.318961, lng: 7.882788, altM: 665.6 }
];
