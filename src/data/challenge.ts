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

// Routenmodell v3 (2026-09-04): vermessen im Kalibriergang vom 2026-09-04 mit
// zwei Geräten gleichzeitig (iPhone Safari + Huawei Chrome). Die Strecke besteht
// aus 7 Treppenabschnitten mit 245, 19, 97, 7, 100, 195 und 487 Stufen und
// 6 stufenlosen Verbindungswegen dazwischen — zusammen 52,5 m der 532 m Route.
// Genau dort vergab das Modell v2 rund 130 Phantom-Stufen, weil es die Stufen
// gleichmäßig über die Strecke verteilte.
//
// Aufbau: Abschnittsgrenzen sind harte Anker (im Stehen bewusst eingetragen),
// die 50er-Zwischenmarken sind weiche Stützstellen. Teilstrecken mit
// physikalisch unmöglicher Stufendichte (> 3,5 Stufen/m — eine verspätet
// getippte Marke) werden verworfen. Positionen sind der Mittelwert beider
// Geräte, deren Fixes im Median 9,3 m auseinanderlagen; Höhen stammen vom
// iPhone, weil Android eine ellipsoidische Höhe mit ~38 m Versatz liefert.
// Stufenlose Abschnitte tragen an beiden Enden denselben Stufenwert, dadurch
// steht der Zähler dort still.
//
// Erzeugt mit scripts/build-route-model-v3.py. Verifiziert gegen den
// unabhängigen Lauf vom 2026-07-14: max. 23 Stufen Abweichung an den zwölf
// fotografierten 100er-Marken (Modell v2: 43), kein Punkt weiter als 10 m
// von der Route.
export const routeModelVersion = 3;

export const routeWaypoints: RouteWaypoint[] = [
  { steps: 0, lat: 47.315238, lng: 7.886964, altM: 425.3 },
  { steps: 15, lat: 47.315291, lng: 7.886943, altM: 424.2 },
  { steps: 35, lat: 47.315346, lng: 7.886863, altM: 430.3 },
  { steps: 50, lat: 47.315384, lng: 7.886805, altM: 435.4 },
  { steps: 66, lat: 47.315432, lng: 7.886742, altM: 436.4 },
  { steps: 85, lat: 47.315491, lng: 7.886672, altM: 442.2 },
  { steps: 100, lat: 47.315537, lng: 7.886617, altM: 446.4 },
  { steps: 113, lat: 47.315562, lng: 7.886567, altM: 450.3 },
  { steps: 132, lat: 47.315614, lng: 7.886512, altM: 454.1 },
  { steps: 150, lat: 47.315672, lng: 7.886484, altM: 456.2 },
  { steps: 163, lat: 47.315713, lng: 7.886459, altM: 460.9 },
  { steps: 182, lat: 47.315756, lng: 7.886382, altM: 466.0 },
  { steps: 200, lat: 47.315800, lng: 7.886318, altM: 468.7 },
  { steps: 228, lat: 47.315868, lng: 7.886228, altM: 472.5 },
  { steps: 245, lat: 47.315920, lng: 7.886201, altM: 475.1 },
  { steps: 245, lat: 47.315956, lng: 7.886184, altM: 475.4 },
  { steps: 264, lat: 47.315993, lng: 7.886128, altM: 479.0 },
  { steps: 264, lat: 47.316017, lng: 7.886104, altM: 480.5 },
  { steps: 292, lat: 47.316158, lng: 7.885939, altM: 485.6 },
  { steps: 300, lat: 47.316209, lng: 7.885907, altM: 486.7 },
  { steps: 313, lat: 47.316249, lng: 7.885859, altM: 490.1 },
  { steps: 333, lat: 47.316294, lng: 7.885770, altM: 494.1 },
  { steps: 350, lat: 47.316357, lng: 7.885732, altM: 499.5 },
  { steps: 361, lat: 47.316380, lng: 7.885688, altM: 501.8 },
  { steps: 361, lat: 47.316589, lng: 7.885501, altM: 506.1 },
  { steps: 368, lat: 47.316623, lng: 7.885492, altM: 507.7 },
  { steps: 368, lat: 47.316689, lng: 7.885408, altM: 508.2 },
  { steps: 400, lat: 47.316827, lng: 7.885253, altM: 515.4 },
  { steps: 412, lat: 47.316854, lng: 7.885185, altM: 520.3 },
  { steps: 431, lat: 47.316912, lng: 7.885108, altM: 524.7 },
  { steps: 450, lat: 47.316976, lng: 7.885032, altM: 525.7 },
  { steps: 460, lat: 47.317006, lng: 7.885007, altM: 527.2 },
  { steps: 468, lat: 47.317033, lng: 7.884987, altM: 533.7 },
  { steps: 468, lat: 47.317057, lng: 7.884960, altM: 533.4 },
  { steps: 478, lat: 47.317091, lng: 7.884902, altM: 534.3 },
  { steps: 500, lat: 47.317186, lng: 7.884797, altM: 536.4 },
  { steps: 517, lat: 47.317237, lng: 7.884733, altM: 541.2 },
  { steps: 534, lat: 47.317298, lng: 7.884681, altM: 543.0 },
  { steps: 550, lat: 47.317350, lng: 7.884630, altM: 546.4 },
  { steps: 583, lat: 47.317409, lng: 7.884567, altM: 549.1 },
  { steps: 611, lat: 47.317465, lng: 7.884524, altM: 549.9 },
  { steps: 641, lat: 47.317508, lng: 7.884445, altM: 555.2 },
  { steps: 663, lat: 47.317555, lng: 7.884431, altM: 553.8 },
  { steps: 663, lat: 47.317593, lng: 7.884401, altM: 554.5 },
  { steps: 663, lat: 47.317681, lng: 7.884235, altM: 564.1 },
  { steps: 663, lat: 47.317710, lng: 7.884186, altM: 567.6 },
  { steps: 700, lat: 47.317797, lng: 7.884059, altM: 574.7 },
  { steps: 716, lat: 47.317852, lng: 7.884009, altM: 579.6 },
  { steps: 738, lat: 47.317929, lng: 7.883961, altM: 582.2 },
  { steps: 750, lat: 47.317965, lng: 7.883916, altM: 582.4 },
  { steps: 759, lat: 47.317994, lng: 7.883879, altM: 584.3 },
  { steps: 775, lat: 47.318053, lng: 7.883851, altM: 584.5 },
  { steps: 786, lat: 47.318088, lng: 7.883802, altM: 589.0 },
  { steps: 800, lat: 47.318130, lng: 7.883750, altM: 590.8 },
  { steps: 820, lat: 47.318193, lng: 7.883702, altM: 593.7 },
  { steps: 838, lat: 47.318243, lng: 7.883654, altM: 600.8 },
  { steps: 850, lat: 47.318268, lng: 7.883605, altM: 605.2 },
  { steps: 875, lat: 47.318333, lng: 7.883539, altM: 606.6 },
  { steps: 900, lat: 47.318369, lng: 7.883431, altM: 612.8 },
  { steps: 927, lat: 47.318432, lng: 7.883361, altM: 617.1 },
  { steps: 950, lat: 47.318487, lng: 7.883302, altM: 623.7 },
  { steps: 978, lat: 47.318552, lng: 7.883266, altM: 628.8 },
  { steps: 1000, lat: 47.318601, lng: 7.883238, altM: 632.6 },
  { steps: 1014, lat: 47.318642, lng: 7.883202, altM: 639.0 },
  { steps: 1033, lat: 47.318693, lng: 7.883140, altM: 640.9 },
  { steps: 1050, lat: 47.318741, lng: 7.883095, altM: 645.1 },
  { steps: 1064, lat: 47.318785, lng: 7.883075, altM: 650.4 },
  { steps: 1085, lat: 47.318839, lng: 7.883024, altM: 653.2 },
  { steps: 1100, lat: 47.318873, lng: 7.882972, altM: 654.9 },
  { steps: 1114, lat: 47.318906, lng: 7.882923, altM: 662.6 },
  { steps: 1133, lat: 47.318966, lng: 7.882887, altM: 663.9 },
  { steps: 1150, lat: 47.319001, lng: 7.882823, altM: 664.8 },
  { steps: 1150, lat: 47.319000, lng: 7.882818, altM: 664.0 },
];
