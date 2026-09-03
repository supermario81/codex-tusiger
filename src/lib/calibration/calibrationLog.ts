import type { RunPoint } from "../types";

// Kalibriergang: Der Nutzer geht die Strecke einmal ab und markiert jeden
// Übergang zwischen Treppenabschnitt und stufenlosem Weg. Daraus entsteht das
// Routenmodell — Position UND exakte Stufenzahl je Abschnitt.
//
// Warum nicht über Sensoren: Die stufenlosen Zwischenstücke sind teils steil,
// teils flach. Höhengewinn unterscheidet Treppe und Weg deshalb nicht. Die
// Strecke ist statisch, also wird sie einmal vermessen statt bei jedem Lauf
// neu geraten.

export type MarkKind = "stairs_start" | "stairs_end" | "step_marker";

export type CalibrationMark = {
  index: number;
  atMs: number;
  kind: MarkKind;
  sectionIndex: number;
  sectionKind: "stairs" | "path";
  // Nur bei stairs_end: die vom Nutzer eingetragene Stufenzahl des Abschnitts.
  sectionSteps: number | null;
  // Aus den 50er-Marken hochgezählt, unabhängig von der Eingabe.
  markerSteps: number;
  lat: number;
  lng: number;
  altitudeM: number | null;
  accuracyM: number;
};

function csvValue(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(Math.round(value * 1e7) / 1e7) : "";
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

class CalibrationRecorder {
  private marks: CalibrationMark[] = [];
  private track: RunPoint[] = [];
  private startedAtMs = 0;
  private recording = false;
  private sectionIndex = 0;
  private sectionKind: "stairs" | "path" = "path";
  private markerSteps = 0;
  private walkId = "";

  get isRecording(): boolean {
    return this.recording;
  }
  get currentSectionKind(): "stairs" | "path" {
    return this.sectionKind;
  }
  get currentSectionIndex(): number {
    return this.sectionIndex;
  }
  get stepsFromMarkers(): number {
    return this.markerSteps;
  }
  get markList(): CalibrationMark[] {
    return this.marks;
  }
  get trackLength(): number {
    return this.track.length;
  }
  get id(): string {
    return this.walkId;
  }
  get hasData(): boolean {
    return this.marks.length > 0 || this.track.length > 0;
  }

  start(walkId: string, startedAtMs = Date.now()): void {
    this.marks = [];
    this.track = [];
    this.startedAtMs = startedAtMs;
    this.recording = true;
    this.sectionIndex = 0;
    this.sectionKind = "path";
    this.markerSteps = 0;
    this.walkId = walkId;
  }

  stop(): void {
    this.recording = false;
  }

  addTrackPoint(point: RunPoint): void {
    if (!this.recording) return;
    this.track.push(point);
  }

  private lastPoint(): RunPoint | null {
    return this.track.at(-1) ?? null;
  }

  private push(kind: MarkKind, sectionSteps: number | null): CalibrationMark | null {
    const point = this.lastPoint();
    if (!this.recording || !point) {
      return null;
    }
    const mark: CalibrationMark = {
      index: this.marks.length,
      atMs: Date.now() - this.startedAtMs,
      kind,
      sectionIndex: this.sectionIndex,
      sectionKind: this.sectionKind,
      sectionSteps,
      markerSteps: this.markerSteps,
      lat: point.lat,
      lng: point.lng,
      altitudeM: point.altitudeM,
      accuracyM: point.accuracyM
    };
    this.marks.push(mark);
    return mark;
  }

  // Treppenabschnitt beginnt: der stufenlose Abschnitt davor ist beendet.
  startStairs(): CalibrationMark | null {
    if (this.sectionKind === "stairs") return null;
    const mark = this.push("stairs_start", null);
    if (mark) {
      this.sectionIndex += 1;
      this.sectionKind = "stairs";
    }
    return mark;
  }

  // Treppenabschnitt endet: die gezählte Stufenzahl gehört zu diesem Abschnitt.
  endStairs(sectionSteps: number | null): CalibrationMark | null {
    if (this.sectionKind !== "stairs") return null;
    const mark = this.push("stairs_end", sectionSteps);
    if (mark) {
      this.sectionIndex += 1;
      this.sectionKind = "path";
    }
    return mark;
  }

  // Stützstelle alle 50 Stufen innerhalb eines Treppenabschnitts.
  addStepMarker(stepsPerMarker = 50): CalibrationMark | null {
    this.markerSteps += stepsPerMarker;
    const mark = this.push("step_marker", null);
    if (!mark) {
      this.markerSteps -= stepsPerMarker;
    }
    return mark;
  }

  undoLast(): void {
    const mark = this.marks.pop();
    if (!mark) return;
    if (mark.kind === "step_marker") {
      this.markerSteps = mark.markerSteps - 50;
    } else {
      this.sectionIndex = mark.sectionIndex;
      this.sectionKind = mark.sectionKind;
    }
  }

  marksCsv(): string {
    const header = [
      "mark_index", "timestamp_ms", "kind",
      "section_index", "section_kind", "section_steps", "marker_steps",
      "lat", "lng", "altitude_m", "accuracy_m", "walk_id"
    ].join(",");
    const rows = this.marks.map((mark) => [
      mark.index, mark.atMs, mark.kind,
      mark.sectionIndex, mark.sectionKind, mark.sectionSteps, mark.markerSteps,
      mark.lat, mark.lng, mark.altitudeM, mark.accuracyM, this.walkId
    ].map(csvValue).join(","));
    return `${header}\n${rows.join("\n")}\n`;
  }

  trackCsv(): string {
    const header = [
      "timestamp_ms", "lat", "lng", "altitude_m", "altitude_accuracy_m",
      "accuracy_m", "speed_mps", "heading", "walk_id"
    ].join(",");
    const rows = this.track.map((point) => [
      new Date(point.recordedAt).getTime() - this.startedAtMs,
      point.lat, point.lng, point.altitudeM, point.altitudeAccuracyM,
      point.accuracyM, point.speedMps, point.heading, this.walkId
    ].map(csvValue).join(","));
    return `${header}\n${rows.join("\n")}\n`;
  }
}

export const calibrationLog = new CalibrationRecorder();
