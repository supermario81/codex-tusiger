// Schritterkennung aus der Beschleunigung.
//
// Kalibriert am Kalibriergang vom 2026-09-04 (iPhone Safari + Huawei Chrome
// gleichzeitig, je ~14000 Messungen bei 10 Hz). Ergebnis dort: in der Summe
// 1150 bzw. 1153 erkannte Schritte bei real 1150 — ein Fehler von 0 bis 3
// Stufen. Zum Vergleich liegt die GPS-gestuetzte Schaetzung bei rund ±20.
//
// Verfahren: Der Betrag der Beschleunigung enthaelt die Schwerkraft als
// konstanten Sockel. Ein gleitender Mittelwert ueber ein knappes Zeitfenster
// entfernt ihn, ohne die Schrittfrequenz anzutasten (Schritte liegen bei 1 bis
// 3 Hz, das Fenster wirkt darunter). Auf dem so befreiten Signal werden lokale
// Maxima oberhalb einer Schwelle gezaehlt, mit einer Sperrzeit dagegen, dass
// ein Schritt doppelt zaehlt.
//
// Die Parameter stammen aus einem einzigen, langsam gegangenen Kalibriergang
// mit Handy in der Hand. Fuer normale Laeufe und andere Trageweisen sind sie
// noch nicht bestaetigt — deshalb laeuft der Detektor vorerst nur mit und
// steuert weder Anzeige noch Wertung.

export type StepDetectorOptions = {
  // Fenster des gleitenden Mittelwerts. Muss deutlich laenger als ein Schritt
  // sein, sonst frisst der Hochpass das Signal selbst.
  baselineWindowMs?: number;
  // Mindesthoehe eines Ausschlags ueber dem Mittelwert.
  peakThreshold?: number;
  // Sperrzeit nach einem erkannten Schritt. 350 ms erlaubt knapp 3 Schritte
  // pro Sekunde; gemessen lagen die besten Werte bei 340 und 460 ms.
  refractoryMs?: number;
};

const defaults: Required<StepDetectorOptions> = {
  baselineWindowMs: 900,
  peakThreshold: 2.0,
  refractoryMs: 350
};

type Sample = { atMs: number; magnitude: number };

export class AccelerationStepDetector {
  private readonly options: Required<StepDetectorOptions>;
  private window: Sample[] = [];
  private windowSum = 0;
  private steps = 0;
  private lastStepAtMs = Number.NEGATIVE_INFINITY;
  // Die Peak-Pruefung braucht den Vorgaenger und den Nachfolger, der Kandidat
  // wird deshalb um einen Messwert verzoegert bewertet.
  private previousDeviation: number | null = null;
  private candidate: { atMs: number; deviation: number } | null = null;

  constructor(options: StepDetectorOptions = {}) {
    this.options = { ...defaults, ...options };
  }

  get stepCount(): number {
    return this.steps;
  }

  reset(): void {
    this.window = [];
    this.windowSum = 0;
    this.steps = 0;
    this.lastStepAtMs = Number.NEGATIVE_INFINITY;
    this.previousDeviation = null;
    this.candidate = null;
  }

  /** Liefert die Gesamtzahl erkannter Schritte nach dieser Messung. */
  push(atMs: number, x: number, y: number, z: number): number {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      return this.steps;
    }
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    this.window.push({ atMs, magnitude });
    this.windowSum += magnitude;
    while (this.window.length > 1 && atMs - this.window[0].atMs > this.options.baselineWindowMs) {
      this.windowSum -= this.window[0].magnitude;
      this.window.shift();
    }
    // Solange das Fenster nicht gefuellt ist, ist der Mittelwert unbrauchbar.
    if (atMs - this.window[0].atMs < this.options.baselineWindowMs / 2) {
      return this.steps;
    }

    const baseline = this.windowSum / this.window.length;
    const deviation = magnitude - baseline;

    if (this.candidate !== null) {
      const isPeak =
        this.candidate.deviation > this.options.peakThreshold &&
        this.candidate.deviation >= (this.previousDeviation ?? Number.NEGATIVE_INFINITY) &&
        this.candidate.deviation > deviation;
      if (isPeak && this.candidate.atMs - this.lastStepAtMs >= this.options.refractoryMs) {
        this.steps += 1;
        this.lastStepAtMs = this.candidate.atMs;
      }
      this.previousDeviation = this.candidate.deviation;
    }
    this.candidate = { atMs, deviation };
    return this.steps;
  }
}
