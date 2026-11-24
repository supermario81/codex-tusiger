import { Check, Download, Footprints, LocateFixed, Square, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { calibrationLog, type CalibrationMark } from "../../lib/calibration/calibrationLog";
import { isSensorLogEnabled, requestMotionPermission, sensorLog } from "../../lib/debug/sensorLog";
import { positionToRunPoint } from "../run/runUtils";

const stepsPerMarker = 50;

function downloadFile(content: string, fileName: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function CalibrationPage() {
  const { config, profile, t } = useApp();
  const [recording, setRecording] = useState(false);
  const [marks, setMarks] = useState<CalibrationMark[]>([]);
  const [sectionKind, setSectionKind] = useState<"stairs" | "path">("path");
  const [markerSteps, setMarkerSteps] = useState(0);
  const [trackPoints, setTrackPoints] = useState(0);
  const [pendingSteps, setPendingSteps] = useState("");
  const [askSteps, setAskSteps] = useState(false);
  const [note, setNote] = useState<[string, string]>(["Noch nicht gestartet.", "Not started yet."]);
  const watchId = useRef<number | null>(null);
  const walkId = useRef("");

  function stopWatch() {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }

  useEffect(() => stopWatch, []);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  function sync() {
    setMarks([...calibrationLog.markList]);
    setSectionKind(calibrationLog.currentSectionKind);
    setMarkerSteps(calibrationLog.stepsFromMarkers);
    setTrackPoints(calibrationLog.trackLength);
  }

  async function startWalk() {
    if (!navigator.geolocation) {
      setNote(["Dieser Browser unterstützt keine Geolocation.", "This browser does not support geolocation."]);
      return;
    }
    walkId.current = crypto.randomUUID();
    calibrationLog.start(walkId.current);
    if (isSensorLogEnabled()) {
      await requestMotionPermission();
      sensorLog.start(walkId.current, config.id);
    }
    setRecording(true);
    setNote(["Kalibriergang läuft. Markiere jeden Übergang.", "Calibration walk running. Mark every transition."]);
    stopWatch();
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const point = positionToRunPoint(position);
        calibrationLog.addTrackPoint(point);
        sensorLog.recordGps(point, {
          stageIndex: calibrationLog.currentSectionIndex,
          computedSteps: calibrationLog.stepsFromMarkers,
          computedDistanceM: null
        });
        sync();
      },
      () => setNote(["GPS-Signal wird gesucht...", "Searching for GPS signal..."]),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );
  }

  function stopWalk() {
    stopWatch();
    calibrationLog.stop();
    sensorLog.stop();
    setRecording(false);
    setNote(["Kalibriergang beendet. Jetzt die CSV-Dateien exportieren.", "Calibration walk finished. Now export the CSV files."]);
  }

  function toggleSection() {
    if (sectionKind === "path") {
      if (!calibrationLog.startStairs()) {
        setNote(["Noch kein GPS-Punkt vorhanden — kurz warten.", "No GPS point yet — wait a moment."]);
        return;
      }
      setNote([`Treppenabschnitt ${calibrationLog.currentSectionIndex} läuft.`, `Stair section ${calibrationLog.currentSectionIndex} running.`]);
      sync();
      return;
    }
    // Treppe endet: Zaehlerstand erfragen, bei dem der Abschnitt geendet hat.
    // Vorbelegt mit dem Stand aus den 50er-Marken, falls er weitergezaehlt hat.
    const suggestion = calibrationLog.stepsFromMarkers;
    setPendingSteps(suggestion > calibrationLog.lastConfirmedSteps ? String(suggestion) : "");
    setAskSteps(true);
  }

  function confirmSectionSteps() {
    const parsed = Number.parseInt(pendingSteps, 10);
    const valid = Number.isFinite(parsed) && parsed > 0;
    const previous = calibrationLog.lastConfirmedSteps;
    const mark = calibrationLog.endStairs(valid ? parsed : null);
    setAskSteps(false);
    setNote(
      valid
        ? [`Abschnitt bis Stufe ${parsed} gespeichert (${mark?.sectionSteps ?? parsed - previous} Stufen).`, `Section up to step ${parsed} saved (${mark?.sectionSteps ?? parsed - previous} steps).`]
        : ["Abschnitt ohne Zählerstand gespeichert — bitte in der CSV nachtragen.", "Section saved without a count — please add it in the CSV."]
    );
    sync();
  }

  function addMarker() {
    if (!calibrationLog.addStepMarker(stepsPerMarker)) {
      setNote(["Noch kein GPS-Punkt vorhanden — kurz warten.", "No GPS point yet — wait a moment."]);
      return;
    }
    sync();
  }

  function undo() {
    calibrationLog.undoLast();
    sync();
    setNote(["Letzte Markierung entfernt.", "Last mark removed."]);
  }

  const stairSections = marks.filter((mark) => mark.kind === "stairs_end");
  const totalCountedSteps = stairSections.reduce(
    (highest, mark) => Math.max(highest, mark.cumulativeSteps ?? 0),
    0
  );

  return (
    <PageShell back nav={false}>
      <section className="pre-run">
        <h1>{t("Streckenkalibrierung", "Route calibration")}</h1>
        <p>{t("Strecke einmal abgehen und jeden Übergang markieren", "Walk the route once and mark every transition")}</p>

        <GlassPanel className="check-list">
          <article>
            <span className="round-icon"><LocateFixed aria-hidden /></span>
            <div>
              <strong>{recording ? t("Aufzeichnung läuft", "Recording") : t("Bereit", "Ready")}</strong>
              <small>{t(...note)}</small>
            </div>
            <span className={`check-dot ${recording ? "ok" : "warn"}`}>
              {recording ? <Check /> : <Square />}
            </span>
          </article>
          <article>
            <span className="round-icon"><Footprints aria-hidden /></span>
            <div>
              <strong>{sectionKind === "stairs" ? t("Auf der Treppe", "On the stairs") : t("Stufenloser Weg", "Step-free path")}</strong>
              <small>
                {t("Abschnitt", "Section")} {calibrationLog.currentSectionIndex} · {marks.length} {t("Markierungen", "marks")} ·{" "}
                {trackPoints} {t("GPS-Punkte", "GPS points")}
              </small>
            </div>
            <span className={`check-dot ${sectionKind === "stairs" ? "ok" : "warn"}`}>
              {sectionKind === "stairs" ? <Check /> : <Square />}
            </span>
          </article>
        </GlassPanel>

        {!recording ? (
          <Button icon={<LocateFixed />} onClick={() => void startWalk()}>{t("Kalibriergang starten", "Start calibration walk")}</Button>
        ) : (
          <>
            <Button
              icon={<Footprints />}
              variant={sectionKind === "stairs" ? "danger" : "primary"}
              onClick={toggleSection}
            >
              {sectionKind === "stairs" ? t("Stufen enden hier", "Steps end here") : t("Stufen beginnen hier", "Steps begin here")}
            </Button>
            <Button variant="secondary" icon={<Check />} onClick={addMarker} disabled={sectionKind !== "stairs"}>
              +{stepsPerMarker} {t("Stufen", "steps")} ({markerSteps})
            </Button>
            <Button variant="glass" icon={<Undo2 />} onClick={undo} disabled={marks.length === 0}>
              {t("Letzte Markierung zurück", "Undo last mark")}
            </Button>
            <Button variant="secondary" icon={<Square />} onClick={stopWalk}>{t("Kalibriergang beenden", "Finish calibration walk")}</Button>
          </>
        )}

        {marks.length > 0 ? (
          <GlassPanel className="details-list">
            <h2>{t("Abschnitte", "Sections")}</h2>
            {stairSections.length === 0 ? (
              <p>{t("Noch kein Treppenabschnitt abgeschlossen.", "No stair section completed yet.")}</p>
            ) : (
              stairSections.map((mark) => (
                <p key={mark.index} className="check-row">
                  <Footprints />
                  <span className="check-text">
                    <strong>{t("Treppenabschnitt", "Stair section")} {mark.sectionIndex - 1}</strong>
                    <small>
                      {t("bis Stufe", "up to step")} {mark.cumulativeSteps ?? "?"} · {mark.lat.toFixed(6)}, {mark.lng.toFixed(6)}
                    </small>
                  </span>
                  <b>{mark.sectionSteps ?? "?"}</b>
                </p>
              ))
            )}
            <p>
              <Footprints /> {t("Summe erfasster Stufen", "Total recorded steps")}
              <span>{totalCountedSteps} / {config.totalSteps}</span>
            </p>
          </GlassPanel>
        ) : null}

        {!recording && calibrationLog.hasData ? (
          <>
            <Button
              variant="glass"
              icon={<Download />}
              onClick={() => downloadFile(calibrationLog.marksCsv(), `tusiger-calibration-marks-${calibrationLog.id}.csv`)}
            >
              {t("Markierungen als CSV", "Marks as CSV")}
            </Button>
            <Button
              variant="glass"
              icon={<Download />}
              onClick={() => downloadFile(calibrationLog.trackCsv(), `tusiger-calibration-track-${calibrationLog.id}.csv`)}
            >
              {t("GPS-Spur als CSV", "GPS track as CSV")} ({trackPoints} {t("Punkte", "points")})
            </Button>
            {sensorLog.hasDataFor(calibrationLog.id) ? (
              <Button
                variant="glass"
                icon={<Download />}
                onClick={() => downloadFile(sensorLog.toCsv(), `tusiger-calibration-sensors-${calibrationLog.id}.csv`)}
              >
                {t("Sensordaten als CSV", "Sensor data as CSV")} ({sensorLog.sampleCount} {t("Messungen", "samples")})
              </Button>
            ) : null}
          </>
        ) : null}

        {askSteps ? (
          <div className="confirm-sheet" role="dialog" aria-modal="true" aria-label={t("Stufenzahl eintragen", "Enter step count")}>
            <div>
              <h2>{t("Bei welcher Stufe hat der Abschnitt geendet?", "At which step did the section end?")}</h2>
              <p>
                {t(
                  `Dein Zählerstand insgesamt, nicht die Stufen dieses Abschnitts. Letzter bestätigter Stand: ${calibrationLog.lastConfirmedSteps}. Aus den 50er-Marken gezählt: ${markerSteps}. Leer lassen, wenn du es nachtragen willst.`,
                  `Your total count, not the steps of this section. Last confirmed count: ${calibrationLog.lastConfirmedSteps}. Counted from the 50-step marks: ${markerSteps}. Leave empty to add it later.`
                )}
              </p>
              <label className="input-wrap">
                <span>{t("Zählerstand am Ende des Abschnitts", "Count at the end of the section")}</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={pendingSteps}
                  onChange={(event) => setPendingSteps(event.currentTarget.value.replace(/\D/g, ""))}
                />
              </label>
              <button type="button" onClick={() => setAskSteps(false)}>{t("Abbrechen", "Cancel")}</button>
              <button type="button" onClick={confirmSectionSteps}>{t("Abschnitt speichern", "Save section")}</button>
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
