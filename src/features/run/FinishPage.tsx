import { BarChart3, Check, Clock3, Home, Trophy, XCircle } from "lucide-react";
import { CSSProperties, useEffect, useMemo, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { localStore } from "../../lib/storage/localStore";
import { formatDuration } from "../../lib/geo/geo";
import { useApp } from "../../app/AppContext";
import { playRunFailSound, playRunFanfare } from "../../lib/audio/runAudio";
import { debugRunEvent } from "../../lib/debug/runDebug";

const confettiColors = ["#344E41", "#588157", "#a3b18a", "#c2a747", "#d5bd68", "#e9e5d6"];

// Leichtes DOM/CSS-Konfetti: ~50 transform-animierte Elemente über 3–4,6 s,
// keine Canvas-Bibliothek, kein Layout-Thrashing beim Scrollen.
function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 50 }, (_, index) => {
        const size = 6 + Math.random() * 6;
        return {
          left: Math.random() * 100,
          size,
          delay: Math.random() * 0.9,
          duration: 3 + Math.random() * 1.6,
          driftPx: Math.round(-50 + Math.random() * 100),
          rotateDeg: Math.round(200 + Math.random() * 420),
          color: confettiColors[index % confettiColors.length]
        };
      }),
    []
  );

  return (
    <div className="confetti" aria-hidden>
      {pieces.map((piece, index) => (
        <span
          key={index}
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${Math.max(4, piece.size * 0.45)}px`,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-drift": `${piece.driftPx}px`,
              "--confetti-rotate": `${piece.rotateDeg}deg`
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

export function FinishPage() {
  const { config } = useApp();
  const runId = localStorage.getItem("tusiger.lastRunId");
  const run = localStore.readRuns().find((item) => item.id === runId);
  // Erfolgserlebnis für gültige UND zu prüfende Läufe — nur hart ungültige
  // Läufe bekommen den Sorry-Screen.
  const isCelebration = Boolean(run && (run.status === "valid" || run.status === "needs_review"));
  const isReview = run?.status === "needs_review";
  const playedRunId = useRef<string | null>(null);

  useEffect(() => {
    if (!run) {
      return;
    }
    if (playedRunId.current === run.id) {
      return;
    }
    playedRunId.current = run.id;
    try {
      if (isCelebration) {
        debugRunEvent("success_effects_started", { runId: run.id, status: run.status, estimatedSteps: run.estimatedSteps });
        playRunFanfare();
      } else {
        debugRunEvent("fail_effects_started", { runId: run.id, status: run.status, estimatedSteps: run.estimatedSteps });
        playRunFailSound();
      }
    } catch {
      // Blockiertes Audio (iOS ohne User-Gesture) darf den Finish nie stören.
    }
  }, [isCelebration, run]);

  if (!run) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell nav={false}>
      <section className="finish-page">
        {isCelebration ? <ConfettiBurst /> : null}
        <GlassPanel className="finish-card">
          <span className={`success-medal ${isCelebration ? (isReview ? "review" : "") : "fail"}`}>
            {isCelebration ? (isReview ? <Clock3 /> : <Check />) : <XCircle />}
          </span>
          <h1>{isCelebration ? "DU HAST ES GESCHAFFT!" : "SORRY, DIESER LAUF IST UNGÜLTIG."}</h1>
          <p>
            {isCelebration
              ? isReview
                ? `Alle ${config.totalSteps} Stufen geschafft. Dein Lauf wird noch geprüft — die Details stehen im Laufbericht.`
                : `Du hast alle ${config.totalSteps} Stufen gemeistert.`
              : `Dieser Lauf wurde nicht gültig abgeschlossen. Erfasste Stufen: ${run.estimatedSteps} / ${config.totalSteps}.`}
          </p>
          <small>Deine Zeit</small>
          <strong>{formatDuration(run.durationSeconds)}</strong>
          <ValidationBadge status={run.status} />
          {isCelebration ? (
            <div className={`personal-best ${isReview ? "muted-result" : ""}`}>
              {isReview ? <Clock3 /> : <Trophy />}
              <span>{isReview ? "Zeit (in Prüfung)" : "Persönliche Bestzeit"}</span>
              <b>{formatDuration(run.durationSeconds)}</b>
            </div>
          ) : (
            <div className="personal-best muted-result">
              <XCircle /> <span>Nicht gewertet</span><b>{run.estimatedSteps} / {config.totalSteps}</b>
            </div>
          )}
        </GlassPanel>
        <Link to={`/result/${run.id}`}><Button icon={<BarChart3 />}>Ergebnis ansehen</Button></Link>
        <Link to="/"><Button variant="secondary" icon={<Home />}>Zur Startseite</Button></Link>
        <Link className="action-row" to="/leaderboard">Rangliste</Link>
      </section>
    </PageShell>
  );
}
