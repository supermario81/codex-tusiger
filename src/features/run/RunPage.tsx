import { Square, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { CoachMessage } from "../../components/ui/CoachMessage";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { motivationMessages } from "../../data/challenge";
import { primeRunAudio } from "../../lib/audio/runAudio";
import { debugRunEvent } from "../../lib/debug/runDebug";
import { formatDuration, formatPace } from "../../lib/geo/geo";
import { analyzeRouteTrack } from "../../lib/geo/routeMatcher";
import { localStore } from "../../lib/storage/localStore";
import type { RouteTrackSummary, RunPoint, RunRecord } from "../../lib/types";
import { validateRun } from "../../lib/validation/validateRun";
import { positionToRunPoint } from "./runUtils";

function compactTrackingSummary(summary: RouteTrackSummary, telemetryLimit = 160): RouteTrackSummary {
  if (summary.telemetry.length <= telemetryLimit) {
    return summary;
  }

  return {
    ...summary,
    telemetry: summary.telemetry.slice(-telemetryLimit)
  };
}

export function RunPage() {
  const { config, profile, saveRun, userId } = useApp();
  const navigate = useNavigate();
  const restoredRun = useMemo(() => localStore.readActiveRun(), []);
  const [startedAt] = useState(() => restoredRun?.startedAt ?? new Date().toISOString());
  const [elapsed, setElapsed] = useState(() => restoredRun?.durationSeconds ?? 0);
  const [fullPoints, setFullPoints] = useState<RunPoint[]>(() => restoredRun?.points ?? []);
  const [holdProgress, setHoldProgress] = useState(0);
  const [confirmStop, setConfirmStop] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");
  const holdTimer = useRef<number | null>(null);
  const holdCompleted = useRef(false);
  const isFinishingRef = useRef(false);
  const lastPersistedAt = useRef(0);
  const lastLoggedPointCount = useRef(0);
  const tracking = useMemo(() => analyzeRouteTrack(fullPoints, config), [config, fullPoints]);

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
      debugRunEvent("geolocation_unavailable");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point = positionToRunPoint(position);
        setFullPoints((current) => {
          const next = [...current, point];
          const shouldLog =
            next.length === 1 ||
            next.length - lastLoggedPointCount.current >= 25 ||
            point.accuracyM > config.gpsAccuracyReviewMaxM;
          if (shouldLog) {
            lastLoggedPointCount.current = next.length;
            debugRunEvent("gps_point", {
              pointCount: next.length,
              accuracyM: point.accuracyM,
              altitudeM: point.altitudeM,
              speedMps: point.speedMps
            });
          }
          return next;
        });
      },
      (error) => debugRunEvent("gps_error", { code: error.code, message: error.message }),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [config.gpsAccuracyReviewMaxM]);

  useEffect(() => {
    const now = Date.now();
    if (now - lastPersistedAt.current < 2500 && fullPoints.length > 0) {
      return;
    }
    lastPersistedAt.current = now;
    const active: RunRecord = {
      id: "active-run",
      userId,
      startedAt,
      endedAt: null,
      durationSeconds: elapsed,
      status: "draft",
      validationScore: 0,
      validationReasons: [],
      startLat: fullPoints[0]?.lat ?? null,
      startLng: fullPoints[0]?.lng ?? null,
      endLat: fullPoints.at(-1)?.lat ?? null,
      endLng: fullPoints.at(-1)?.lng ?? null,
      elevationGainM: null,
      gpsAccuracyAvgM: null,
      gpsAccuracyMinM: null,
      gpsAccuracyMaxM: null,
      estimatedSteps: tracking.finalSteps,
      pacePer100StepsSeconds: tracking.finalSteps > 0 ? elapsed / (tracking.finalSteps / 100) : null,
      points: fullPoints,
      trackingSummary: compactTrackingSummary(tracking)
    };
    localStore.writeActiveRun(active);
  }, [elapsed, fullPoints, startedAt, tracking, userId]);

  useEffect(() => {
    if (fullPoints.length === 0) {
      return;
    }
    if (fullPoints.length % 25 !== 0 && tracking.finalSteps < config.totalSteps) {
      return;
    }
    debugRunEvent("route_progress", {
      pointCount: fullPoints.length,
      finalSteps: tracking.finalSteps,
      maxSteps: tracking.maxSteps,
      confidence: tracking.averageConfidence,
      confidenceLevel: tracking.confidenceLevel,
      routeAdherenceRatio: tracking.routeAdherenceRatio,
      continuityScore: tracking.continuityScore,
      altitudeGainM: tracking.altitudeGainM,
      interpretedElevationGainM: tracking.interpretedElevationGainM
    });
  }, [config.totalSteps, fullPoints.length, tracking]);

  const latestPoint = fullPoints.at(-1) ?? null;
  const gpsOk = tracking.confidenceLevel === "high" || (tracking.confidenceLevel === "estimated" && Boolean(latestPoint));
  const gpsLabel = tracking.confidenceLevel === "high" ? "GPS OK" : tracking.confidenceLevel === "estimated" ? "GPS geschätzt" : "GPS ungenau";
  const steps = tracking.finalSteps;
  const pacePer100 = steps > 0 ? elapsed / (steps / 100) : null;
  const coach = motivationMessages.find((item) => steps >= item.minSteps && steps < item.maxSteps)?.message ?? "Du hast es gleich geschafft.";
  const altitudeGain = Math.round(tracking.altitudeGainM ?? tracking.interpretedElevationGainM);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  async function finishRun(trigger: "hold" | "confirm" = "confirm") {
    if (isFinishingRef.current) {
      debugRunEvent("finish_ignored_duplicate", { trigger, pointCount: fullPoints.length });
      return;
    }

    primeRunAudio();
    cancelHold();
    setConfirmStop(false);
    setFinishError("");
    isFinishingRef.current = true;
    setIsFinishing(true);

    const sourcePoints = [...fullPoints];
    const actualElapsed = Math.max(elapsed, (Date.now() - new Date(startedAt).getTime()) / 1000);
    const finishedAt = new Date(new Date(startedAt).getTime() + actualElapsed * 1000).toISOString();
    const validation = validateRun({ startedAt, endedAt: finishedAt }, sourcePoints, config);
    const forceReview = localStorage.getItem("tusiger.forceReview") === "true";
    const status = forceReview && validation.status === "valid" ? "needs_review" : validation.status;
    const run: RunRecord = {
      id: crypto.randomUUID(),
      userId,
      startedAt,
      endedAt: finishedAt,
      durationSeconds: validation.metrics.durationSeconds,
      status,
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
      points: sourcePoints,
      trackingSummary: validation.tracking
    };

    debugRunEvent("validation_result", {
      trigger,
      status,
      validationStatus: validation.status,
      pointCount: sourcePoints.length,
      durationSeconds: validation.metrics.durationSeconds,
      estimatedSteps: validation.metrics.estimatedSteps,
      routeProgressSteps: validation.metrics.routeProgressSteps,
      maxProgressSteps: validation.metrics.maxProgressSteps,
      elevationGain: validation.metrics.elevationGain,
      interpretedElevationGainM: validation.tracking.interpretedElevationGainM,
      score: validation.score,
      reasons: validation.reasons
    });

    try {
      await saveRun(run);
      localStorage.setItem("tusiger.lastRunId", run.id);
      localStore.clearActiveRun();
      navigate("/finish");
    } catch (error) {
      isFinishingRef.current = false;
      setIsFinishing(false);
      setFinishError(error instanceof Error ? error.message : "Lauf konnte nicht gespeichert werden.");
      debugRunEvent("finish_save_failed", { message: error instanceof Error ? error.message : String(error) });
    }
  }

  function startHold() {
    if (isFinishingRef.current) {
      return;
    }
    primeRunAudio();
    holdCompleted.current = false;
    const started = Date.now();
    holdTimer.current = window.setInterval(() => {
      const progress = (Date.now() - started) / 1200;
      setHoldProgress(Math.min(1, progress));
      if (progress >= 1) {
        holdCompleted.current = true;
        void finishRun("hold");
      }
    }, 80);
  }

  function openStopConfirm() {
    if (isFinishingRef.current) {
      return;
    }
    if (holdCompleted.current) {
      holdCompleted.current = false;
      return;
    }
    primeRunAudio();
    setConfirmStop(true);
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
          <header><span className={`live-dot ${gpsOk ? "" : "warn"}`} /> {gpsLabel} <span>+{altitudeGain} m</span></header>
          <strong className="big-timer">{formatDuration(elapsed)}</strong>
          <small>Zeit</small>
          <b>{steps} / {config.totalSteps}</b>
          <span>Stufen</span>
          <ProgressBar value={steps} max={config.totalSteps} />
          <div className="run-metrics">
            <span><Timer /> Pace / 100<br /><strong>{formatPace(pacePer100)}</strong></span>
            <span>GPS Punkte<br /><strong>{fullPoints.length}</strong></span>
            <span>Höhenmeter<br /><strong>{altitudeGain}</strong></span>
          </div>
        </div>
        <CoachMessage message={coach} />
        <button
          className="stop-button"
          type="button"
          disabled={isFinishing}
          aria-busy={isFinishing}
          onClick={openStopConfirm}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          style={{ background: `linear-gradient(90deg, #8d4a37 ${holdProgress * 100}%, rgba(112,54,40,.86) ${holdProgress * 100}%)` }}
        >
          <span><Square /></span> {isFinishing ? "Speichern..." : "Lauf beenden"}
        </button>
        {finishError ? <p className="form-error">{finishError}</p> : null}
        {confirmStop ? (
          <div className="confirm-sheet" role="dialog" aria-modal="true" aria-label="Lauf beenden bestätigen">
            <div>
              <h2>Lauf beenden?</h2>
              <p>Tippe bestätigen oder halte den roten Button 1.2 Sekunden gedrückt.</p>
              <button type="button" onClick={() => setConfirmStop(false)}>Weiterlaufen</button>
              <button type="button" disabled={isFinishing} onClick={() => void finishRun("confirm")}>
                {isFinishing ? "Speichern..." : "Beenden bestätigen"}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}
