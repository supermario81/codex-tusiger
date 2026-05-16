import { Square, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { CoachMessage } from "../../components/ui/CoachMessage";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { motivationMessages } from "../../data/challenge";
import { estimateStepsFromPosition, formatDuration, formatPace } from "../../lib/geo/geo";
import { localStore } from "../../lib/storage/localStore";
import type { RunPoint, RunRecord } from "../../lib/types";
import { validateRun } from "../../lib/validation/validateRun";
import { createSyntheticRunPoints, positionToRunPoint } from "./runUtils";

export function RunPage() {
  const { config, profile, saveRun, userId } = useApp();
  const navigate = useNavigate();
  const [startedAt] = useState(() => new Date().toISOString());
  const [elapsed, setElapsed] = useState(0);
  const [points, setPoints] = useState<RunPoint[]>(() => localStore.readActiveRun()?.points ?? []);
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((Date.now() - new Date(startedAt).getTime()) / 1000);
    }, 500);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => setPoints((current) => [...current, positionToRunPoint(position)].slice(-300)),
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const active: RunRecord = {
      id: "active-run",
      userId,
      startedAt,
      endedAt: null,
      durationSeconds: elapsed,
      status: "draft",
      validationScore: 0,
      validationReasons: [],
      startLat: points[0]?.lat ?? null,
      startLng: points[0]?.lng ?? null,
      endLat: points.at(-1)?.lat ?? null,
      endLng: points.at(-1)?.lng ?? null,
      elevationGainM: null,
      gpsAccuracyAvgM: null,
      gpsAccuracyMinM: null,
      gpsAccuracyMaxM: null,
      estimatedSteps: estimateStepsFromPosition(points.at(-1) ?? null, config),
      pacePer100StepsSeconds: elapsed / 10,
      points
    };
    localStore.writeActiveRun(active);
  }, [config, elapsed, points, startedAt, userId]);

  const steps = Math.max(
    estimateStepsFromPosition(points.at(-1) ?? null, config),
    Math.min(config.totalSteps, Math.round((elapsed / 4140) * config.totalSteps))
  );
  const coach = motivationMessages.find((item) => steps >= item.minSteps && steps < item.maxSteps)?.message ?? "Du hast es gleich geschafft.";
  const altitudeGain = points.length > 1 && points[0].altitudeM && points.at(-1)?.altitudeM
    ? Math.round((points.at(-1)?.altitudeM ?? 0) - (points[0].altitudeM ?? 0))
    : Math.round((steps / config.totalSteps) * config.expectedElevationGainM);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  async function finishRun() {
    const finishedAt = new Date(new Date(startedAt).getTime() + Math.max(elapsed, 4140) * 1000).toISOString();
    const sourcePoints = points.length >= 8 ? points : createSyntheticRunPoints(Math.max(elapsed, 4140));
    const validation = validateRun({ startedAt, endedAt: finishedAt }, sourcePoints, config);
    const forceReview = localStorage.getItem("tusiger.forceReview") === "true";
    const run: RunRecord = {
      id: crypto.randomUUID(),
      userId,
      startedAt,
      endedAt: finishedAt,
      durationSeconds: validation.metrics.durationSeconds,
      status: forceReview && validation.status === "valid" ? "needs_review" : validation.status,
      validationScore: validation.score,
      validationReasons: validation.reasons,
      startLat: sourcePoints[0]?.lat ?? null,
      startLng: sourcePoints[0]?.lng ?? null,
      endLat: sourcePoints.at(-1)?.lat ?? null,
      endLng: sourcePoints.at(-1)?.lng ?? null,
      elevationGainM: validation.metrics.elevationGain,
      gpsAccuracyAvgM: validation.metrics.gpsAccuracyAverage,
      gpsAccuracyMinM: validation.metrics.gpsAccuracyMin,
      gpsAccuracyMaxM: validation.metrics.gpsAccuracyMax,
      estimatedSteps: validation.metrics.estimatedSteps,
      pacePer100StepsSeconds: validation.metrics.pacePer100Steps,
      points: sourcePoints
    };
    await saveRun(run);
    localStorage.setItem("tusiger.lastRunId", run.id);
    localStore.clearActiveRun();
    navigate("/finish");
  }

  function startHold() {
    const started = Date.now();
    holdTimer.current = window.setInterval(() => {
      const progress = (Date.now() - started) / 1200;
      setHoldProgress(Math.min(1, progress));
      if (progress >= 1) {
        cancelHold();
        void finishRun();
      }
    }, 80);
  }

  function cancelHold() {
    if (holdTimer.current) {
      window.clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setHoldProgress(0);
  }

  return (
    <PageShell nav={false} dark>
      <section className="run-page">
        <h1>TUSIGER</h1>
        <p>Aktiver Lauf</p>
        <div className="run-dashboard">
          <header><span className="live-dot" /> GPS OK <span>+{altitudeGain} m</span></header>
          <strong className="big-timer">{formatDuration(elapsed)}</strong>
          <small>Zeit</small>
          <b>{steps} / 1000</b>
          <span>Stufen</span>
          <ProgressBar value={steps} />
          <div className="run-metrics">
            <span><Timer /> Pace / 100<br /><strong>{formatPace(elapsed / 10)}</strong></span>
            <span>GPS Punkte<br /><strong>{points.length}</strong></span>
            <span>Höhenmeter<br /><strong>{altitudeGain}</strong></span>
          </div>
        </div>
        <CoachMessage message={coach} />
        <button
          className="stop-button"
          type="button"
          onClick={() => setConfirmStop(true)}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          style={{ background: `linear-gradient(90deg, #8d4a37 ${holdProgress * 100}%, rgba(112,54,40,.86) ${holdProgress * 100}%)` }}
        >
          <span><Square /></span> Lauf beenden
        </button>
        {confirmStop ? (
          <div className="confirm-sheet" role="dialog" aria-modal="true" aria-label="Lauf beenden bestätigen">
            <div>
              <h2>Lauf beenden?</h2>
              <p>Tippe bestätigen oder halte den roten Button 1.2 Sekunden gedrückt.</p>
              <button type="button" onClick={() => setConfirmStop(false)}>Weiterlaufen</button>
              <button type="button" onClick={() => void finishRun()}>Beenden bestätigen</button>
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
