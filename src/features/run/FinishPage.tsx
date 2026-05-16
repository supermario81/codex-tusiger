import { BarChart3, Check, Trophy } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { localStore } from "../../lib/storage/localStore";
import { formatDuration } from "../../lib/geo/geo";

export function FinishPage() {
  const runId = localStorage.getItem("tusiger.lastRunId");
  const run = localStore.readRuns().find((item) => item.id === runId);

  if (!run) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell nav={false}>
      <section className="finish-page">
        <div className="confetti" aria-hidden />
        <GlassPanel className="finish-card">
          <span className="success-medal"><Check /></span>
          <h1>DU HAST ES GESCHAFFT!</h1>
          <p>Du hast alle 1000 Stufen gemeistert.</p>
          <small>Deine Zeit</small>
          <strong>{formatDuration(run.durationSeconds)}</strong>
          <ValidationBadge status={run.status} />
          <div className="personal-best">
            <Trophy /> <span>Persönliche Bestzeit</span><b>{formatDuration(run.durationSeconds)}</b>
          </div>
        </GlassPanel>
        <Link to={`/result/${run.id}`}><Button icon={<BarChart3 />}>Ergebnis ansehen</Button></Link>
        <Link className="action-row" to="/leaderboard">Rangliste</Link>
      </section>
    </PageShell>
  );
}
