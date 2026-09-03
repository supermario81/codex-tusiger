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
  const { config, profile } = useApp();
  const [recording, setRecording] = useState(false);
  const [marks, setMarks] = useState<CalibrationMark[]>([]);
  const [sectionKind, setSectionKind] = useState<"stairs" | "path">("path");
  const [markerSteps, setMarkerSteps] = useState(0);
  const [trackPoints, setTrackPoints] = useState(0);
  const [pendingSteps, setPendingSteps] = useState("");
  const [askSteps, setAskSteps] = useState(false);
  const [note, setNote] = useState("Noch nicht gestartet.");
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
      setNote("Dieser Browser unterstützt keine Geolocation.");
      return;
    }
    walkId.current = crypto.randomUUID();
    calibrationLog.start(walkId.current);
    if (isSensorLogEnabled()) {
      await requestMotionPermission();
      sensorLog.start(walkId.current, config.id);
    }
    setRecording(true);
    setNote("Kalibriergang läuft. Markiere jeden Übergang.");
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
      () => setNote("GPS-Signal wird gesucht..."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );
  }

  function stopWalk() {
    stopWatch();
    calibrationLog.stop();
    sensorLog.stop();
    setRecording(false);
    setNote("Kalibriergang beendet. Jetzt die CSV-Dateien exportieren.");
  }

  function toggleSection() {
    if (sectionKind === "path") {
      if (!calibrationLog.startStairs()) {
        setNote("Noch kein GPS-Punkt vorhanden — kurz warten.");
        return;
      }
      setNote(`Treppenabschnitt ${calibrationLog.currentSectionIndex} läuft.`);
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
        ? `Abschnitt bis Stufe ${parsed} gespeichert (${mark?.sectionSteps ?? parsed - previous} Stufen).`
        : "Abschnitt ohne Zählerstand gespeichert — bitte in der CSV nachtragen."
    );
    sync();
  }

  function addMarker() {
    if (!calibrationLog.addStepMarker(stepsPerMarker)) {
      setNote("Noch kein GPS-Punkt vorhanden — kurz warten.");
      return;
    }
    sync();
  }

  function undo() {
    calibrationLog.undoLast();
    sync();
    setNote("Letzte Markierung entfernt.");
  }

  const stairSections = marks.filter((mark) => mark.kind === "stairs_end");
  const totalCountedSteps = stairSections.reduce(
    (highest, mark) => Math.max(highest, mark.cumulativeSteps ?? 0),
    0
  );

  return (
    <PageShell back nav={false}>
      <section className="pre-run">
        <h1>Streckenkalibrierung</h1>
        <p>Strecke einmal abgehen und jeden Übergang markieren</p>

        <GlassPanel className="check-list">
          <article>
            <span className="round-icon"><LocateFixed aria-hidden /></span>
            <div>
              <strong>{recording ? "Aufzeichnung läuft" : "Bereit"}</strong>
              <small>{note}</small>
            </div>
            <span className={`check-dot ${recording ? "ok" : "warn"}`}>
              {recording ? <Check /> : <Square />}
            </span>
          </article>
          <article>
            <span className="round-icon"><Footprints aria-hidden /></span>
            <div>
              <strong>{sectionKind === "stairs" ? "Auf der Treppe" : "Stufenloser Weg"}</strong>
              <small>
                Abschnitt {calibrationLog.currentSectionIndex} · {marks.length} Markierungen ·{" "}
                {trackPoints} GPS-Punkte
              </small>
            </div>
            <span className={`check-dot ${sectionKind === "stairs" ? "ok" : "warn"}`}>
              {sectionKind === "stairs" ? <Check /> : <Square />}
            </span>
          </article>
        </GlassPanel>

        {!recording ? (
          <Button icon={<LocateFixed />} onClick={() => void startWalk()}>Kalibriergang starten</Button>
        ) : (
          <>
            <Button
              icon={<Footprints />}
              variant={sectionKind === "stairs" ? "danger" : "primary"}
              onClick={toggleSection}
            >
              {sectionKind === "stairs" ? "Stufen enden hier" : "Stufen beginnen hier"}
            </Button>
            <Button variant="secondary" icon={<Check />} onClick={addMarker} disabled={sectionKind !== "stairs"}>
              +{stepsPerMarker} Stufen ({markerSteps})
            </Button>
            <Button variant="glass" icon={<Undo2 />} onClick={undo} disabled={marks.length === 0}>
              Letzte Markierung zurück
            </Button>
            <Button variant="secondary" icon={<Square />} onClick={stopWalk}>Kalibriergang beenden</Button>
          </>
        )}

        {marks.length > 0 ? (
          <GlassPanel className="details-list">
            <h2>Abschnitte</h2>
            {stairSections.length === 0 ? (
              <p>Noch kein Treppenabschnitt abgeschlossen.</p>
            ) : (
              stairSections.map((mark) => (
                <p key={mark.index} className="check-row">
                  <Footprints />
                  <span className="check-text">
                    <strong>Treppenabschnitt {mark.sectionIndex - 1}</strong>
                    <small>
                      bis Stufe {mark.cumulativeSteps ?? "?"} · {mark.lat.toFixed(6)}, {mark.lng.toFixed(6)}
                    </small>
                  </span>
                  <b>{mark.sectionSteps ?? "?"}</b>
                </p>
              ))
            )}
            <p>
              <Footprints /> Summe erfasster Stufen
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
              Markierungen als CSV
            </Button>
            <Button
              variant="glass"
              icon={<Download />}
              onClick={() => downloadFile(calibrationLog.trackCsv(), `tusiger-calibration-track-${calibrationLog.id}.csv`)}
            >
              GPS-Spur als CSV ({trackPoints} Punkte)
            </Button>
            {sensorLog.hasDataFor(calibrationLog.id) ? (
              <Button
                variant="glass"
                icon={<Download />}
                onClick={() => downloadFile(sensorLog.toCsv(), `tusiger-calibration-sensors-${calibrationLog.id}.csv`)}
              >
                Sensordaten als CSV ({sensorLog.sampleCount} Messungen)
              </Button>
            ) : null}
          </>
        ) : null}

        {askSteps ? (
          <div className="confirm-sheet" role="dialog" aria-modal="true" aria-label="Stufenzahl eintragen">
            <div>
              <h2>Bei welcher Stufe hat der Abschnitt geendet?</h2>
              <p>
                Dein Zählerstand insgesamt, nicht die Stufen dieses Abschnitts. Letzter
                bestätigter Stand: {calibrationLog.lastConfirmedSteps}. Aus den 50er-Marken
                gezählt: {markerSteps}. Leer lassen, wenn du es nachtragen willst.
              </p>
              <label className="input-wrap">
                <span>Zählerstand am Ende des Abschnitts</span>
                <input
                  autoFocus
                  inputMode="numeric"
                  value={pendingSteps}
                  onChange={(event) => setPendingSteps(event.currentTarget.value.replace(/\D/g, ""))}
                />
              </label>
              <button type="button" onClick={() => setAskSteps(false)}>Abbrechen</button>
              <button type="button" onClick={confirmSectionSteps}>Abschnitt speichern</button>
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
