import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { GlassPanel } from "../../components/ui/Card";
import { demoLeaderboard } from "../../data/challenge";
import { formatDuration } from "../../lib/geo/geo";

const tabs = ["Heute", "Woche", "Monat", "Gesamt"];

export function LeaderboardPage() {
  const [active, setActive] = useState("Heute");
  const podium = demoLeaderboard.slice(0, 3);
  const rows = demoLeaderboard.slice(3);

  return (
    <PageShell>
      <section className="leaderboard-page">
        <h1>Rangliste</h1>
        <p>Gemeinsam weiter. Jeden Tag.</p>
        <div className="segmented">
          {tabs.map((tab) => (
            <button key={tab} className={tab === active ? "active" : ""} type="button" onClick={() => setActive(tab)}>
              {tab}
            </button>
          ))}
        </div>
        <GlassPanel className="podium">
          {podium.map((run) => (
            <article key={run.id} className={`rank-${run.rank}`}>
              <span className="medal">{run.rank}</span>
              <Avatar name={run.nickname} url={run.avatarUrl} />
              <strong>{run.nickname}</strong>
              <b>{formatDuration(run.durationSeconds)}</b>
              <small>{new Date(run.date).toLocaleDateString("de-CH")}</small>
              <CheckCircle2 />
            </article>
          ))}
        </GlassPanel>
        <GlassPanel className="leaderboard-list">
          {rows.map((run) => (
            <article key={run.id} className={run.isCurrentUser ? "current-user" : ""}>
              <b>{run.rank}</b>
              <Avatar name={run.nickname} url={run.avatarUrl} size="sm" />
              <strong>{run.nickname}</strong>
              <span>{formatDuration(run.durationSeconds)}</span>
              <small>{new Date(run.date).toLocaleDateString("de-CH")}</small>
              <CheckCircle2 />
            </article>
          ))}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
