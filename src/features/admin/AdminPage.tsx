import { CheckCircle2, Save, XCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";

export function AdminPage() {
  const { config, isSupabaseConfigured, leaderboard, legalPages, profile, runs, setupError } = useApp();
  if (profile?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell back>
      <section className="simple-page">
        <h1>Admin</h1>
        <GlassPanel className="admin-checklist">
          <h2>Produktions-Check</h2>
          <p><span>{isSupabaseConfigured ? <CheckCircle2 /> : <XCircle />}</span> Supabase Anon Key konfiguriert</p>
          <p><span>{setupError ? <XCircle /> : <CheckCircle2 />}</span> Supabase Schema erreichbar</p>
          <p><span>{legalPages.length > 0 ? <CheckCircle2 /> : <XCircle />}</span> Legal Pages geladen</p>
          <p><span>{leaderboard ? <CheckCircle2 /> : <XCircle />}</span> Leaderboard View bereit</p>
          {setupError ? <p className="form-error">{setupError}</p> : null}
        </GlassPanel>
        <GlassPanel>
          <h2>Challenge Config</h2>
          <p>Start: {config.startLat}, {config.startLng} · Radius {config.startRadiusM} m</p>
          <p>Ziel: {config.endLat}, {config.endLng} · Radius {config.endRadiusM} m</p>
          <p>Höhe gültig: {config.elevationValidMinM}–{config.elevationValidMaxM} m</p>
          <Button icon={<Save />}>Änderungen speichern</Button>
        </GlassPanel>
        <GlassPanel>
          <h2>Runs in Prüfung</h2>
          {runs.filter((run) => run.status === "needs_review").map((run) => (
            <p key={run.id}>{run.id.slice(0, 8)} · Score {run.validationScore}</p>
          ))}
        </GlassPanel>
      </section>
    </PageShell>
  );
}
