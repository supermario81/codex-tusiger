import { appVersion } from "../appVersion";
import { AccelerationStepDetector } from "../fusion/stepDetector";

// Sensor-Logger fuer Feldtests. Zeichnet waehrend eines Laufs die verfuegbaren
// Sensoren auf und gibt sie am Ende als CSV aus, damit die Sensorfusion mit
// echten Daten statt mit Annahmen entwickelt werden kann.
//
// Verfuegbarkeit auf iPhone Safari (Stand 2026):
//   - DeviceMotionEvent: accelerationIncludingGravity, acceleration (linear),
//     rotationRate (Gyroskop). Braucht requestPermission() aus einer Nutzergeste.
//   - DeviceOrientationEvent: webkitCompassHeading (magnetometer-abgeleitet).
//   - NICHT verfuegbar: rohes Magnetometer, Barometer, Step-Detector/-Counter.
// Die Spalten bleiben trotzdem im Schema, damit dieselbe Datei spaeter von
// Android oder einer nativen Huelle vollstaendig gefuellt werden kann.

const enabledKey = "tusiger.sensorLog.enabled";
const motionSampleIntervalMs = 100; // 10 Hz
const maxSamples = 60_000;

export type SensorAppState = {
  stageIndex: number | null;
  computedSteps: number | null;
  computedDistanceM: number | null;
};

export type SensorSample = {
  timestampMs: number;
  accX: number | null;
  accY: number | null;
  accZ: number | null;
  linAccX: number | null;
  linAccY: number | null;
  linAccZ: number | null;
  gyroX: number | null;
  gyroY: number | null;
  gyroZ: number | null;
  magX: number | null;
  magY: number | null;
  magZ: number | null;
  pressureHpa: number | null;
  altitudeM: number | null;
  gpsLat: number | null;
  gpsLon: number | null;
  gpsAlt: number | null;
  gpsSpeed: number | null;
  gpsHeading: number | null;
  gpsAccuracy: number | null;
  gpsProvider: string;
  stepDetector: number | null;
  stepCounter: number | null;
  stageIndex: number | null;
  computedSteps: number | null;
  computedDistanceM: number | null;
  // Schattenbetrieb: Schritte aus der Beschleunigung. Steuert nichts, wird nur
  // mitgeschrieben, damit sich beide Verfahren am selben Lauf vergleichen lassen.
  detectedSteps: number | null;
};

export function isSensorLogEnabled(): boolean {
  try {
    return localStorage.getItem(enabledKey) === "true";
  } catch {
    return false;
  }
}

export function setSensorLogEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(enabledKey, String(enabled));
  } catch {
    // Ohne Speicher bleibt der Logger fuer diese Sitzung aus.
  }
}

type PermissionCapableMotion = {
  requestPermission?: () => Promise<"granted" | "denied" | "default">;
};

// iOS verlangt die Zustimmung aus einer echten Nutzergeste heraus.
export async function requestMotionPermission(): Promise<boolean> {
  if (typeof DeviceMotionEvent === "undefined") {
    return false;
  }
  const motion = DeviceMotionEvent as unknown as PermissionCapableMotion;
  if (typeof motion.requestPermission !== "function") {
    return true; // Android/Desktop brauchen keine Freigabe.
  }
  try {
    return (await motion.requestPermission()) === "granted";
  } catch {
    return false;
  }
}

function csvValue(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Math.round(value * 1e6) / 1e6) : "";
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

class SensorLogger {
  private samples: SensorSample[] = [];
  private runId = "";
  private challengeId = "";
  private startedAtMs = 0;
  private recording = false;
  private lastMotionAt = 0;
  private latestMotion: Partial<SensorSample> = {};
  private latestHeading: number | null = null;
  private stepDetector = new AccelerationStepDetector();
  private motionHandler: ((event: DeviceMotionEvent) => void) | null = null;
  private orientationHandler: ((event: DeviceOrientationEvent) => void) | null = null;
  private genericSensors: Array<{ stop: () => void }> = [];

  get isRecording(): boolean {
    return this.recording;
  }

  get sampleCount(): number {
    return this.samples.length;
  }

  // Schattenzaehler aus der Beschleunigung, nur zur Anzeige im Bericht.
  get detectedStepCount(): number {
    return this.stepDetector.stepCount;
  }

  get loggedRunId(): string {
    return this.runId;
  }

  hasDataFor(runId: string): boolean {
    return this.samples.length > 0 && this.runId === runId;
  }

  start(runId: string, challengeId: string, startedAtMs = Date.now()): void {
    this.stop();
    this.samples = [];
    this.runId = runId;
    this.challengeId = challengeId;
    this.startedAtMs = startedAtMs;
    this.recording = true;
    this.stepDetector.reset();

    this.motionHandler = (event: DeviceMotionEvent) => {
      const now = Date.now();
      const gravity = event.accelerationIncludingGravity;
      if (gravity) {
        // Der Detektor bekommt JEDE Messung, nicht nur die protokollierten —
        // die Drosselung auf 10 Hz betrifft nur die Dateigroesse.
        this.stepDetector.push(now, gravity.x ?? 0, gravity.y ?? 0, gravity.z ?? 0);
      }
      this.latestMotion = {
        accX: event.accelerationIncludingGravity?.x ?? null,
        accY: event.accelerationIncludingGravity?.y ?? null,
        accZ: event.accelerationIncludingGravity?.z ?? null,
        linAccX: event.acceleration?.x ?? null,
        linAccY: event.acceleration?.y ?? null,
        linAccZ: event.acceleration?.z ?? null,
        gyroX: event.rotationRate?.alpha ?? null,
        gyroY: event.rotationRate?.beta ?? null,
        gyroZ: event.rotationRate?.gamma ?? null
      };
      if (now - this.lastMotionAt < motionSampleIntervalMs) {
        return;
      }
      this.lastMotionAt = now;
      this.push(now, {});
    };

    this.orientationHandler = (event: DeviceOrientationEvent) => {
      const compass = (event as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading;
      this.latestHeading = typeof compass === "number" ? compass : event.alpha ?? null;
    };

    // Ohne DOM (Tests, SSR) laeuft nur die GPS-Aufzeichnung.
    if (typeof window !== "undefined") {
      window.addEventListener("devicemotion", this.motionHandler);
      window.addEventListener("deviceorientation", this.orientationHandler);
      this.startGenericSensors();
    }
  }

  // Chrome auf Android liefert ueber die Generic Sensor API Werte, die iOS
  // Safari nicht hat — vor allem das rohe Magnetometer und eine verlaessliche
  // lineare Beschleunigung. Barometer und Schrittzaehler gibt es auch dort
  // nicht; die Spalten bleiben leer.
  private startGenericSensors(): void {
    const scope = window as unknown as Record<string, unknown>;

    const attach = (
      name: string,
      frequency: number,
      apply: (reading: { x: number | null; y: number | null; z: number | null }) => void
    ) => {
      const Ctor = scope[name] as (new (options: { frequency: number }) => {
        addEventListener: (type: string, listener: () => void) => void;
        start: () => void;
        stop: () => void;
        x?: number;
        y?: number;
        z?: number;
      }) | undefined;
      if (typeof Ctor !== "function") {
        return;
      }
      try {
        const sensor = new Ctor({ frequency });
        sensor.addEventListener("reading", () => {
          apply({ x: sensor.x ?? null, y: sensor.y ?? null, z: sensor.z ?? null });
        });
        sensor.start();
        this.genericSensors.push({ stop: () => sensor.stop() });
      } catch {
        // Sensor gesperrt oder nicht vorhanden: der Rest laeuft weiter.
      }
    };

    attach("Magnetometer", 10, (reading) => {
      this.latestMotion.magX = reading.x;
      this.latestMotion.magY = reading.y;
      this.latestMotion.magZ = reading.z;
    });
    attach("LinearAccelerationSensor", 10, (reading) => {
      this.latestMotion.linAccX = reading.x;
      this.latestMotion.linAccY = reading.y;
      this.latestMotion.linAccZ = reading.z;
    });
  }

  stop(): void {
    this.genericSensors.forEach((sensor) => {
      try {
        sensor.stop();
      } catch {
        // Bereits gestoppt.
      }
    });
    this.genericSensors = [];
    if (typeof window !== "undefined") {
      if (this.motionHandler) window.removeEventListener("devicemotion", this.motionHandler);
      if (this.orientationHandler) window.removeEventListener("deviceorientation", this.orientationHandler);
    }
    this.motionHandler = null;
    this.orientationHandler = null;
    this.recording = false;
  }

  // Ein GPS-Fix erzeugt immer eine Zeile, angereichert mit dem letzten
  // Bewegungswert und dem internen App-Zustand zu diesem Zeitpunkt.
  recordGps(
    position: {
      lat: number;
      lng: number;
      altitudeM: number | null;
      accuracyM: number;
      speedMps: number | null;
      heading: number | null;
      recordedAt: string;
    },
    state: SensorAppState
  ): void {
    if (!this.recording) {
      return;
    }
    this.push(new Date(position.recordedAt).getTime(), {
      gpsLat: position.lat,
      gpsLon: position.lng,
      gpsAlt: position.altitudeM,
      gpsSpeed: position.speedMps,
      gpsHeading: position.heading ?? this.latestHeading,
      gpsAccuracy: position.accuracyM,
      gpsProvider: position.accuracyM <= 25 ? "gps" : "network",
      ...state
    });
  }

  private push(timestampMs: number, extra: Partial<SensorSample>): void {
    if (this.samples.length >= maxSamples) {
      return;
    }
    this.samples.push({
      timestampMs: timestampMs - this.startedAtMs,
      accX: null, accY: null, accZ: null,
      linAccX: null, linAccY: null, linAccZ: null,
      gyroX: null, gyroY: null, gyroZ: null,
      magX: null, magY: null, magZ: null,
      pressureHpa: null,
      altitudeM: null,
      gpsLat: null, gpsLon: null, gpsAlt: null,
      gpsSpeed: null, gpsHeading: null, gpsAccuracy: null,
      gpsProvider: "",
      stepDetector: null, stepCounter: null,
      stageIndex: null, computedSteps: null, computedDistanceM: null,
      detectedSteps: this.stepDetector.stepCount,
      ...this.latestMotion,
      ...extra
    });
  }

  toCsv(): string {
    const device = typeof navigator === "undefined" ? "unknown" : navigator.userAgent;
    const header = [
      "timestamp_ms",
      "acc_x", "acc_y", "acc_z",
      "lin_acc_x", "lin_acc_y", "lin_acc_z",
      "gyro_x", "gyro_y", "gyro_z",
      "mag_x", "mag_y", "mag_z",
      "pressure_hPa", "altitude_m",
      "gps_lat", "gps_lon", "gps_alt", "gps_speed", "gps_heading", "gps_accuracy", "gps_provider",
      "step_detector", "step_counter",
      "stage_index", "computed_steps", "computed_distance_m",
      "detected_steps",
      "run_id", "challenge_id"
    ].join(",");

    const meta = [
      `# device=${csvValue(device)}`,
      `# app=tusiger v${appVersion.version} build ${appVersion.buildNumber} ${appVersion.commit}`,
      `# started_at=${new Date(this.startedAtMs).toISOString()}`,
      `# time_base=ms_since_run_start`
    ].join("\n");

    const rows = this.samples.map((sample) => [
      sample.timestampMs,
      sample.accX, sample.accY, sample.accZ,
      sample.linAccX, sample.linAccY, sample.linAccZ,
      sample.gyroX, sample.gyroY, sample.gyroZ,
      sample.magX, sample.magY, sample.magZ,
      sample.pressureHpa, sample.altitudeM,
      sample.gpsLat, sample.gpsLon, sample.gpsAlt, sample.gpsSpeed, sample.gpsHeading, sample.gpsAccuracy, sample.gpsProvider,
      sample.stepDetector, sample.stepCounter,
      sample.stageIndex, sample.computedSteps, sample.computedDistanceM,
      sample.detectedSteps,
      this.runId, this.challengeId
    ].map(csvValue).join(","));

    return `${meta}\n${header}\n${rows.join("\n")}\n`;
  }

  // Vorlage zum Nachtragen der real gezaehlten Stufen pro Abschnitt.
  toLabelsCsv(): string {
    const durationMs = this.samples.at(-1)?.timestampMs ?? 0;
    return [
      "run_id,start_ms,end_ms,stage_label,real_step_count",
      `${this.runId},0,${durationMs},,`,
      ""
    ].join("\n");
  }
}

export const sensorLog = new SensorLogger();
