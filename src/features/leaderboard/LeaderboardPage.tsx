import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { GlassPanel } from "../../components/ui/Card";
import { formatDuration } from "../../lib/geo/geo";
import { filterLeaderboardByTab } from "../../lib/community/community";

const tabs = ["Heute", "Woche", "Monat", "Gesamt"];

export function LeaderboardPage() {
  const [active, setActive] = useState("Heute");
  const { leaderboard, trackEvent } = useApp();
  const filtered = filterLeaderboardByTab(leaderboard, active as "Heute" | "Woche" | "Monat" | "Gesamt");
  const source = filtered.length > 0 ? filtered : leaderboard;
  const podium = source.slice(0, 3);
  const rows = source.slice(3);
  void trackEvent("leaderboard_viewed", { tab: active });

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
          {source.length === 0 ? <p className="empty-state">Noch keine gültigen Läufe in der Rangliste.</p> : null}
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
