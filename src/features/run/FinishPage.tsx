import { BarChart3, Check, Home, Trophy, XCircle } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { localStore } from "../../lib/storage/localStore";
import { formatDuration } from "../../lib/geo/geo";
import { useApp } from "../../app/AppContext";
import { useEffect, useRef } from "react";
import { playRunFailSound, playRunFanfare } from "../../lib/audio/runAudio";
import { debugRunEvent } from "../../lib/debug/runDebug";

export function FinishPage() {
  const { config } = useApp();
  const runId = localStorage.getItem("tusiger.lastRunId");
  const run = localStore.readRuns().find((item) => item.id === runId);
  const isSuccessful = Boolean(run && run.status === "valid" && run.estimatedSteps >= config.totalSteps);
  const playedRunId = useRef<string | null>(null);

  useEffect(() => {
    if (!run) {
      return;
    }
    if (playedRunId.current === run.id) {
      return;
    }
    playedRunId.current = run.id;
    if (isSuccessful) {
      debugRunEvent("success_effects_started", { runId: run.id, status: run.status, estimatedSteps: run.estimatedSteps });
      playRunFanfare();
    } else {
      debugRunEvent("fail_effects_started", { runId: run.id, status: run.status, estimatedSteps: run.estimatedSteps });
      playRunFailSound();
    }
  }, [isSuccessful, run]);

  if (!run) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell nav={false}>
      <section className="finish-page">
        {isSuccessful ? <div className="confetti" aria-hidden /> : null}
        <GlassPanel className="finish-card">
          <span className={`success-medal ${isSuccessful ? "" : "fail"}`}>
            {isSuccessful ? <Check /> : <XCircle />}
          </span>
          <h1>{isSuccessful ? "DU HAST ES GESCHAFFT!" : "SORRY, DIESER LAUF IST UNGÜLTIG."}</h1>
          <p>
            {isSuccessful
              ? `Du hast alle ${config.totalSteps} Stufen gemeistert.`
              : `Dieser Lauf wurde nicht gültig abgeschlossen. Erfasste Stufen: ${run.estimatedSteps} / ${config.totalSteps}.`}
          </p>
          <small>Deine Zeit</small>
          <strong>{formatDuration(run.durationSeconds)}</strong>
          <ValidationBadge status={run.status} />
          {isSuccessful ? (
            <div className="personal-best">
              <Trophy /> <span>Persönliche Bestzeit</span><b>{formatDuration(run.durationSeconds)}</b>
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
