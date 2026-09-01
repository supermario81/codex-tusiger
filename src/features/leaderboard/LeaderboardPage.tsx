import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Avatar } from "../../components/ui/Avatar";
import { GlassPanel } from "../../components/ui/Card";
import { formatDuration } from "../../lib/geo/geo";
import { filterLeaderboardByTab } from "../../lib/community/community";

// Die ID bleibt der deutsche Filter-Schlüssel (filterLeaderboardByTab), nur das
// sichtbare Label wird übersetzt.
type TabId = "Heute" | "Woche" | "Monat" | "Gesamt";
const tabs: Array<{ id: TabId; de: string; en: string }> = [
  { id: "Heute", de: "Heute", en: "Today" },
  { id: "Woche", de: "Woche", en: "Week" },
  { id: "Monat", de: "Monat", en: "Month" },
  { id: "Gesamt", de: "Gesamt", en: "All time" }
];

export function LeaderboardPage() {
  const [active, setActive] = useState<TabId>("Gesamt");
  const [scope, setScope] = useState<"private" | "public">("private");
  const { language, leaderboard, profile, runs, trackEvent } = useApp();
  const t = language === "en" ? {
    title: "Leaderboard",
    subtitle: "Your times and the public community ranking.",
    private: "Personal",
    public: "Public",
    emptyPrivate: "No valid runs in your personal leaderboard yet.",
    emptyPublic: "No valid runs in the public leaderboard yet.",
    you: "You",
    reviewNote: (count: number) =>
      `${count} ${count === 1 ? "run is" : "runs are"} still under review and not ranked yet.`
  } : {
    title: "Rangliste",
    subtitle: "Deine Zeiten und die öffentliche Community-Rangliste.",
    private: "Persönlich",
    public: "Öffentlich",
    emptyPrivate: "Noch keine gültigen Läufe in deiner persönlichen Rangliste.",
    emptyPublic: "Noch keine gültigen Läufe in der öffentlichen Rangliste.",
    you: "Du",
    reviewNote: (count: number) =>
      `${count} ${count === 1 ? "Lauf wird" : "Läufe werden"} noch geprüft und ${count === 1 ? "ist" : "sind"} noch nicht gewertet.`
  };
  const dateLocale = language === "en" ? "en-GB" : "de-CH";
  const privateLeaderboard = useMemo(() => runs
    .filter((run) => run.status === "valid")
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .map((run, index) => ({
      id: run.id,
      rank: index + 1,
      nickname: profile?.nickname ?? t.you,
      avatarUrl: profile?.avatarUrl ?? "",
      durationSeconds: run.durationSeconds,
      date: run.endedAt ?? run.startedAt,
      status: run.status,
      isCurrentUser: true
    })), [profile?.avatarUrl, profile?.nickname, runs, t.you]);
  const activeSource = scope === "private" ? privateLeaderboard : leaderboard;
  // Rang muss nach dem Zeitfilter vergeben werden, sonst zeigt der erste Eintrag
  // eines gefilterten Zeitraums den Rang aus der ungefilterten Gesamtliste.
  const source = filterLeaderboardByTab(activeSource, active).map((run, index) => ({
    ...run,
    rank: index + 1
  }));
  const runsInReview = scope === "private" ? runs.filter((run) => run.status === "needs_review").length : 0;
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
            <button key={tab.id} className={tab.id === active ? "active" : ""} type="button" onClick={() => setActive(tab.id)}>
              {language === "en" ? tab.en : tab.de}
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
              <small>{new Date(run.date).toLocaleDateString(dateLocale)}</small>
              <CheckCircle2 />
            </article>
          ))}
        </GlassPanel>
        <GlassPanel className="leaderboard-list">
          {source.length === 0 ? <p className="empty-state">{scope === "private" ? t.emptyPrivate : t.emptyPublic}</p> : null}
          {runsInReview > 0 ? <p className="empty-state">{t.reviewNote(runsInReview)}</p> : null}
          {rows.map((run) => (
            <article key={run.id} className={run.isCurrentUser ? "current-user" : ""}>
              <b>{run.rank}</b>
              <Avatar name={run.nickname} url={run.avatarUrl} size="sm" />
              <strong>{run.nickname}</strong>
              <span>{formatDuration(run.durationSeconds)}</span>
              <small>{new Date(run.date).toLocaleDateString(dateLocale)}</small>
              <CheckCircle2 />
            </article>
          ))}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
