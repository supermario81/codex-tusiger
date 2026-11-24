import { CheckCircle2, XCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { GlassPanel } from "../../components/ui/Card";

export function AdminPage() {
  const { config, isSupabaseConfigured, leaderboard, legalPages, profile, runs, setupError, t } = useApp();
  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell back>
      <section className="simple-page">
        <h1>Admin</h1>
        <GlassPanel className="admin-checklist">
          <h2>{t("Produktions-Check", "Production check")}</h2>
          <p><span>{isSupabaseConfigured ? <CheckCircle2 /> : <XCircle />}</span> {t("Supabase Anon Key konfiguriert", "Supabase anon key configured")}</p>
          <p><span>{setupError ? <XCircle /> : <CheckCircle2 />}</span> {t("Supabase Schema erreichbar", "Supabase schema reachable")}</p>
          <p><span>{legalPages.length > 0 ? <CheckCircle2 /> : <XCircle />}</span> {t("Legal Pages geladen", "Legal pages loaded")}</p>
          <p><span>{leaderboard ? <CheckCircle2 /> : <XCircle />}</span> {t("Leaderboard View bereit", "Leaderboard ready")}</p>
          {setupError ? <p className="form-error">{setupError}</p> : null}
        </GlassPanel>
        <GlassPanel>
          <h2>Challenge Config</h2>
          <p>Start: {config.startLat}, {config.startLng} · Radius {config.startRadiusM} m</p>
          <p>{t("Ziel", "Finish")}: {config.endLat}, {config.endLng} · Radius {config.endRadiusM} m</p>
          <p>{t("Höhe gültig", "Valid elevation")}: {config.elevationValidMinM}–{config.elevationValidMaxM} m</p>
        </GlassPanel>
        <GlassPanel>
          <h2>{t("Runs in Prüfung", "Runs in review")}</h2>
          {runs.filter((run) => run.status === "needs_review").map((run) => (
            <p key={run.id}>{run.id.slice(0, 8)} · Score {run.validationScore}</p>
          ))}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
