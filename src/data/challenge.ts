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

// Routenmodell v4 (2026-09-08): abgeleitet aus dem Referenzlauf vom 2026-09-08.
// Jenes iPhone lief die Strecke gueltig und vollstaendig durch und lieferte an
// jeder 100er-Marke einen Screenshot, dessen Dateizeit die Laufsekunde verraet.
// Das ergibt zwoelf exakte Paare aus Position und echtem Stufenstand — die
// bisher belastbarste Grundlage, weil Stufenzahl und Ort aus derselben Quelle
// stammen statt aus einem separaten Kalibriergang.
//
// Die Strecke besteht aus 7 Treppenabschnitten mit 240, 25, 97, 9, 97, 143 und
// 539 Stufen und 6 stufenlosen Verbindungswegen dazwischen.
//
// Was sich gegenueber v3 aendert: Die letzte Abschnittsgrenze wandert von
// Zaehlerstand 663 auf 611. Im Kalibriergang war sie mit 663 eingetragen; das
// verschob 52 Stufen vom letzten in den vorletzten Abschnitt. Sichtbar wurde
// das im Referenzlauf als +27,6 Stufen an der Marke 600 — der einzige grobe
// Ausreisser von v3. Alle fuenf uebrigen Grenzen bestaetigen v3 auf drei
// Stufen genau.
//
// Aufbau: Die Hoehe stammt aus der parallel mitlaufenden Strava-Aufzeichnung
// und ist barometrisch. Die GPS-Hoehe desselben Laufs sammelt ohne Schwelle
// 74 m Phantom-Anstieg an, die barometrische ist praktisch rauschfrei (der
// Aufstieg ist bei Schwelle 0 m und 2 m derselbe). Stufenlose Abschnitte
// tragen an beiden Enden denselben Stufenwert und bekommen eigene
// Stuetzpunkte, damit der Zaehler dort wirklich stillsteht.
//
// Erzeugt mit scripts/build-route-model-v4.py. Verifiziert gegen den
// unabhaengigen Lauf vom 2026-07-14: mittlere Abweichung 4,2 Stufen an den
// zwoelf fotografierten 100er-Marken, maximal 12,5 (Modell v3: 7,9 und 22,6).
export const routeModelVersion = 4;

// Abschnittsstruktur der Strecke.
//
// Der Beschleunigungssensor zaehlt Tritte, nicht Stufen. Auf stufenlosen Wegen
// duerfen Tritte deshalb keine Stufen erzeugen — das steht hier als Faktor 0.
//
// Auf allen Treppenabschnitten, die lang genug fuer eine Aussage sind, steht
// 1,0 — und das ist jetzt gemessen statt angenommen. Unter Modell v3 zeigten
// zwei Abschnitte auf beiden Geraeten unerklaerte Abweichungen: 1,37 Stufen pro
// Tritt auf dem Abschnitt mit angeblich 195 Stufen und 0,91 auf dem mit
// angeblich 487. Mit den korrigierten Groessen 143 und 539 loesen sich beide
// auf:
//
//   Abschnitt   Tritte iPhone   Tritte Android   Faktor v3      Faktor v4
//   143 Stufen        142             143        1,37 / 1,36    1,007 / 1,000
//   539 Stufen        535             536        0,91 / 0,91    1,007 / 1,006
//
// Der Schrittdetektor hatte also die ganze Zeit recht; falsch war die
// Abschnittsgrenze. Zwei unabhaengige Messungen — die Beschleunigung des
// Kalibriergangs und die fotografierten Zonengrenzen des Referenzlaufs —
// kommen auf denselben Wert.
export type RouteSection = {
  kind: "stairs" | "path";
  fromSteps: number;
  toSteps: number;
  /** Gemessen; null, wo der Abschnitt zu kurz fuer eine Aussage ist. */
  stairsPerFootfall: number | null;
};

export const routeSections: RouteSection[] = [
  { kind: "stairs", fromSteps: 0, toSteps: 240, stairsPerFootfall: 1.0 },
  { kind: "path", fromSteps: 240, toSteps: 240, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 240, toSteps: 265, stairsPerFootfall: null },
  { kind: "path", fromSteps: 265, toSteps: 265, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 265, toSteps: 362, stairsPerFootfall: 1.0 },
  { kind: "path", fromSteps: 362, toSteps: 362, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 362, toSteps: 371, stairsPerFootfall: null },
  { kind: "path", fromSteps: 371, toSteps: 371, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 371, toSteps: 468, stairsPerFootfall: 1.0 },
  { kind: "path", fromSteps: 468, toSteps: 468, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 468, toSteps: 611, stairsPerFootfall: 1.0 },
  { kind: "path", fromSteps: 611, toSteps: 611, stairsPerFootfall: 0 },
  { kind: "stairs", fromSteps: 611, toSteps: 1150, stairsPerFootfall: 1.0 }
];

/** Mittleres Verhaeltnis der Abschnitte, die lang genug fuer eine Aussage sind. */
const defaultStairsPerFootfall = 1.0;

/**
 * Liefert das Verhaeltnis Stufen pro Tritt an der aktuellen Position der Route.
 * Auf stufenlosen Wegen ist es 0 — dort erhoehen Tritte die Stufenzahl nicht.
 */
export function stairsPerFootfallAt(steps: number): number {
  // Ein stufenloser Weg belegt genau einen Stufenwert; wer darauf projiziert,
  // steht auf dem Weg. Deshalb hat der Weg an seinem Wert Vorrang vor der
  // Treppe, die dort endet — sonst faende die Suche zuerst die Treppe 0..240
  // und meldete am Zonenwert 240 faelschlich Stufen.
  const rounded = Math.round(steps);
  if (routeSections.some((item) => item.kind === "path" && item.fromSteps === rounded)) {
    return 0;
  }
  const section = routeSections.find(
    (item) => item.kind === "stairs" && steps >= item.fromSteps && steps <= item.toSteps
  );
  return section?.stairsPerFootfall ?? defaultStairsPerFootfall;
}


export const routeWaypoints: RouteWaypoint[] = [
  { steps: 0, lat: 47.3152241, lng: 7.8869355, altM: 429.8 },
  { steps: 45, lat: 47.3153331, lng: 7.8867673, altM: 438.3 },
  { steps: 70, lat: 47.3154147, lng: 7.8867189, altM: 443.0 },
  { steps: 100, lat: 47.3155006, lng: 7.8866203, altM: 449.0 },
  { steps: 137, lat: 47.3155916, lng: 7.8865018, altM: 456.9 },
  { steps: 172, lat: 47.3157094, lng: 7.8864225, altM: 464.8 },
  { steps: 200, lat: 47.3157808, lng: 7.8863183, altM: 470.5 },
  { steps: 225, lat: 47.3158539, lng: 7.8862188, altM: 475.0 },
  { steps: 240, lat: 47.3159021, lng: 7.8861619, altM: 477.7 },
  { steps: 240, lat: 47.31595, lng: 7.8861231, altM: 479.6 },
  { steps: 259, lat: 47.3160117, lng: 7.8860679, altM: 482.6 },
  { steps: 265, lat: 47.3160329, lng: 7.8860413, altM: 483.6 },
  { steps: 265, lat: 47.3160501, lng: 7.8860165, altM: 484.5 },
  { steps: 300, lat: 47.3161606, lng: 7.8858893, altM: 490.1 },
  { steps: 304, lat: 47.3161774, lng: 7.8858906, altM: 490.7 },
  { steps: 339, lat: 47.3162887, lng: 7.8857338, altM: 498.6 },
  { steps: 362, lat: 47.3163741, lng: 7.8856494, altM: 501.9 },
  { steps: 362, lat: 47.3164018, lng: 7.8856352, altM: 502.9 },
  { steps: 362, lat: 47.3165481, lng: 7.8854647, altM: 507.2 },
  { steps: 362, lat: 47.3165617, lng: 7.8854577, altM: 507.5 },
  { steps: 371, lat: 47.3165997, lng: 7.8854398, altM: 508.8 },
  { steps: 371, lat: 47.3166287, lng: 7.8854244, altM: 509.8 },
  { steps: 371, lat: 47.3166738, lng: 7.8853643, altM: 511.4 },
  { steps: 392, lat: 47.3167464, lng: 7.8852823, altM: 514.9 },
  { steps: 400, lat: 47.3167693, lng: 7.8852403, altM: 516.6 },
  { steps: 407, lat: 47.3167783, lng: 7.8851993, altM: 519.0 },
  { steps: 448, lat: 47.3169333, lng: 7.8850457, altM: 527.3 },
  { steps: 458, lat: 47.3169599, lng: 7.8849944, altM: 529.8 },
  { steps: 468, lat: 47.3170033, lng: 7.8849668, altM: 532.0 },
  { steps: 468, lat: 47.3170204, lng: 7.8849626, altM: 533.6 },
  { steps: 468, lat: 47.3170309, lng: 7.8849482, altM: 534.5 },
  { steps: 478, lat: 47.3170544, lng: 7.8848944, altM: 536.3 },
  { steps: 500, lat: 47.3171451, lng: 7.8848219, altM: 540.6 },
  { steps: 508, lat: 47.3171747, lng: 7.8848019, altM: 542.2 },
  { steps: 529, lat: 47.3172304, lng: 7.8847034, altM: 545.4 },
  { steps: 600, lat: 47.3174781, lng: 7.8844694, altM: 557.1 },
  { steps: 603, lat: 47.3174863, lng: 7.8844583, altM: 558.3 },
  { steps: 611, lat: 47.3175105, lng: 7.8844446, altM: 559.5 },
  { steps: 611, lat: 47.3175571, lng: 7.8844112, altM: 561.3 },
  { steps: 611, lat: 47.3175618, lng: 7.884396, altM: 561.4 },
  { steps: 629, lat: 47.3175996, lng: 7.8843209, altM: 563.9 },
  { steps: 652, lat: 47.3176678, lng: 7.8842451, altM: 567.1 },
  { steps: 668, lat: 47.3176996, lng: 7.8841767, altM: 569.4 },
  { steps: 688, lat: 47.3177589, lng: 7.8841143, altM: 572.2 },
  { steps: 695, lat: 47.3177825, lng: 7.8841171, altM: 573.4 },
  { steps: 700, lat: 47.3177902, lng: 7.8840914, altM: 574.3 },
  { steps: 703, lat: 47.3177925, lng: 7.8840783, altM: 574.7 },
  { steps: 722, lat: 47.3178566, lng: 7.8840253, altM: 577.6 },
  { steps: 752, lat: 47.3179302, lng: 7.8839068, altM: 581.8 },
  { steps: 781, lat: 47.318026, lng: 7.8838254, altM: 585.3 },
  { steps: 800, lat: 47.3180802, lng: 7.8837517, altM: 588.1 },
  { steps: 826, lat: 47.3181557, lng: 7.8836759, altM: 592.7 },
  { steps: 837, lat: 47.3181937, lng: 7.883667, altM: 594.2 },
  { steps: 847, lat: 47.3182139, lng: 7.8836195, altM: 596.3 },
  { steps: 877, lat: 47.3183099, lng: 7.8835358, altM: 601.9 },
  { steps: 900, lat: 47.318361, lng: 7.8834412, altM: 606.7 },
  { steps: 933, lat: 47.3184266, lng: 7.8833297, altM: 613.7 },
  { steps: 943, lat: 47.3184583, lng: 7.8833147, altM: 615.3 },
  { steps: 950, lat: 47.318478, lng: 7.883328, altM: 616.4 },
  { steps: 960, lat: 47.3185096, lng: 7.8833065, altM: 618.9 },
  { steps: 965, lat: 47.318507, lng: 7.8832901, altM: 620.4 },
  { steps: 978, lat: 47.3185517, lng: 7.8832852, altM: 623.3 },
  { steps: 988, lat: 47.3185527, lng: 7.8832419, altM: 626.2 },
  { steps: 1000, lat: 47.3185886, lng: 7.8832247, altM: 629.1 },
  { steps: 1014, lat: 47.31863, lng: 7.883198, altM: 631.7 },
  { steps: 1032, lat: 47.3186672, lng: 7.8831335, altM: 635.7 },
  { steps: 1062, lat: 47.3187574, lng: 7.8830757, altM: 642.9 },
  { steps: 1093, lat: 47.31883, lng: 7.882976, altM: 649.8 },
  { steps: 1100, lat: 47.3188528, lng: 7.8829677, altM: 651.2 },
  { steps: 1102, lat: 47.3188568, lng: 7.8829638, altM: 651.5 },
  { steps: 1113, lat: 47.3188642, lng: 7.8829241, altM: 654.6 },
  { steps: 1126, lat: 47.3189025, lng: 7.8829069, altM: 657.4 },
  { steps: 1150, lat: 47.3189565, lng: 7.8828313, altM: 661.3 },
  { steps: 1150, lat: 47.3189602, lng: 7.8828263, altM: 661.4 },
  { steps: 1150, lat: 47.3189526, lng: 7.8828031, altM: 662.5 }
];
