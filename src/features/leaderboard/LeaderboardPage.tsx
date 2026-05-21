import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { GlassPanel } from "../../components/ui/Card";
import { formatDuration } from "../../lib/geo/geo";
import { filterLeaderboardByTab } from "../../lib/community/community";

const tabs = ["Heute", "Woche", "Monat", "Gesamt"];

export function LeaderboardPage() {
  const [active, setActive] = useState("Heute");
  const [scope, setScope] = useState<"private" | "public">("private");
  const { language, leaderboard, profile, runs, trackEvent } = useApp();
  const t = language === "en" ? {
    title: "Leaderboard",
    subtitle: "Your times and the public community ranking.",
    private: "Personal",
    public: "Public",
    emptyPrivate: "No valid runs in your personal leaderboard yet.",
    emptyPublic: "No valid runs in the public leaderboard yet."
  } : {
    title: "Rangliste",
    subtitle: "Deine Zeiten und die öffentliche Community-Rangliste.",
    private: "Persönlich",
    public: "Öffentlich",
    emptyPrivate: "Noch keine gültigen Läufe in deiner persönlichen Rangliste.",
    emptyPublic: "Noch keine gültigen Läufe in der öffentlichen Rangliste."
  };
  const privateLeaderboard = useMemo(() => runs
    .filter((run) => run.status === "valid")
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .map((run, index) => ({
      id: run.id,
      rank: index + 1,
      nickname: profile?.nickname ?? "Du",
      avatarUrl: profile?.avatarUrl ?? "",
      durationSeconds: run.durationSeconds,
      date: run.endedAt ?? run.startedAt,
      status: run.status,
      isCurrentUser: true
    })), [profile?.avatarUrl, profile?.nickname, runs]);
  const activeSource = scope === "private" ? privateLeaderboard : leaderboard;
  const source = filterLeaderboardByTab(activeSource, active as "Heute" | "Woche" | "Monat" | "Gesamt");
  const podium = source.slice(0, 3);
  const rows = source.slice(3);

  useEffect(() => {
    void trackEvent("leaderboard_viewed", { tab: active, scope });
  }, [active, scope, trackEvent]);

  return (
    <PageShell>
      <section className="leaderboard-page">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
        <div className="segmented leaderboard-mode-tabs">
          <button className={scope === "private" ? "active" : ""} type="button" onClick={() => setScope("private")}>
            {t.private}
          </button>
          <button className={scope === "public" ? "active" : ""} type="button" onClick={() => setScope("public")}>
            {t.public}
          </button>
        </div>
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
          {source.length === 0 ? <p className="empty-state">{scope === "private" ? t.emptyPrivate : t.emptyPublic}</p> : null}
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
