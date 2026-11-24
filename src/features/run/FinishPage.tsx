import { BarChart3, Check, Clock3, Home, Trophy, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ConfettiBurst } from "../../components/ui/Confetti";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { localStore } from "../../lib/storage/localStore";
import { formatDuration } from "../../lib/geo/geo";
import { useApp } from "../../app/AppContext";
import { playRunFailSound, playRunFanfare } from "../../lib/audio/runAudio";
import { debugRunEvent } from "../../lib/debug/runDebug";

export function FinishPage() {
  const { config, userId, t } = useApp();
  const runId = localStorage.getItem("tusiger.lastRunId");
  const run = localStore.readRuns(userId).find((item) => item.id === runId);
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
    <PageShell nav={false} logoCelebrationTest>
      <section className="finish-page">
        {isCelebration ? <ConfettiBurst fixed /> : null}
        <GlassPanel className="finish-card">
          <span className={`success-medal ${isCelebration ? (isReview ? "review" : "") : "fail"}`}>
            {isCelebration ? (isReview ? <Clock3 /> : <Check />) : <XCircle />}
          </span>
          <h1>{isCelebration ? t("DU HAST ES GESCHAFFT!", "YOU MADE IT!") : t("SORRY, DIESER LAUF IST UNGÜLTIG.", "SORRY, THIS RUN IS INVALID.")}</h1>
          <p>
            {isCelebration
              ? isReview
                ? t(`Alle ${config.totalSteps} Stufen geschafft. Dein Lauf wird noch geprüft — die Details stehen im Laufbericht.`, `All ${config.totalSteps} steps done. Your run is still being reviewed — see the run report for details.`)
                : t(`Du hast alle ${config.totalSteps} Stufen gemeistert.`, `You mastered all ${config.totalSteps} steps.`)
              : t(`Dieser Lauf wurde nicht gültig abgeschlossen. Erfasste Stufen: ${run.estimatedSteps} / ${config.totalSteps}.`, `This run was not completed validly. Recorded steps: ${run.estimatedSteps} / ${config.totalSteps}.`)}
          </p>
          <small>{t("Deine Zeit", "Your time")}</small>
          <strong>{formatDuration(run.durationSeconds)}</strong>
          <ValidationBadge status={run.status} />
          {isCelebration ? (
            <div className={`personal-best ${isReview ? "muted-result" : ""}`}>
              {isReview ? <Clock3 /> : <Trophy />}
              <span>{isReview ? t("Zeit (in Prüfung)", "Time (in review)") : t("Persönliche Bestzeit", "Personal best")}</span>
              <b>{formatDuration(run.durationSeconds)}</b>
            </div>
          ) : (
            <div className="personal-best muted-result">
              <XCircle /> <span>{t("Nicht gewertet", "Not ranked")}</span><b>{run.estimatedSteps} / {config.totalSteps}</b>
            </div>
          )}
        </GlassPanel>
        <Link to={`/result/${run.id}`}><Button icon={<BarChart3 />}>{t("Ergebnis ansehen", "View result")}</Button></Link>
        <Link to="/"><Button variant="secondary" icon={<Home />}>{t("Zur Startseite", "To start")}</Button></Link>
        <Link className="action-row" to="/leaderboard">{t("Rangliste", "Leaderboard")}</Link>
      </section>
    </PageShell>
  );
}
