import { Download, Flag, LocateFixed, Map, Mountain, Share2, ShieldCheck, Timer } from "lucide-react";
import { useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { formatDuration, formatPace } from "../../lib/geo/geo";

export function ResultPage() {
  const { runId } = useParams();
  const { runs } = useApp();
  const run = runs.find((item) => item.id === runId) ?? runs[0];

  if (!run) {
    return (
      <PageShell back>
        <section className="simple-page"><h1>Laufbericht</h1><p>Noch kein Lauf vorhanden.</p></section>
      </PageShell>
    );
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tusiger-run-${run.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell back nav={false}>
      <section className="result-page">
        <h1>Laufbericht</h1>
        <p>{new Date(run.startedAt).toLocaleString("de-CH")}</p>
        <GlassPanel className="metric-grid">
          <MetricCard icon={<Timer />} label="Gesamtzeit" value={formatDuration(run.durationSeconds)} meta="hh:mm:ss" />
          <MetricCard icon={<Flag />} label="Stufen" value={String(run.estimatedSteps)} meta="Schritte" />
          <MetricCard icon={<Mountain />} label="Höhenmeter" value={`${Math.round(run.elevationGainM ?? 0)} m`} meta="Anstieg" />
          <MetricCard icon={<ShieldCheck />} label="Validierung" value={run.status === "valid" ? "Validiert" : "Prüfung"} meta="GPS & Regeln" />
        </GlassPanel>
        <GlassPanel className="route-card">
          <h2>Route <span><Map size={18} /> Karte</span></h2>
          <svg viewBox="0 0 420 140" role="img" aria-label="Routenlinie">
            <path d="M20 95 C70 92, 92 110, 138 86 S205 73, 234 88 S300 58, 350 48 S380 72, 402 62" />
            <circle cx="20" cy="95" r="8" />
            <path d="M390 42 v42 m0-42 l24 9 -24 9" />
          </svg>
        </GlassPanel>
        <GlassPanel className="details-list">
          <h2>Details</h2>
          <p><LocateFixed /> Startkoordinaten <span>{run.startLat?.toFixed(6)}, {run.startLng?.toFixed(6)}</span></p>
          <p><Flag /> Zielkoordinaten <span>{run.endLat?.toFixed(6)}, {run.endLng?.toFixed(6)}</span></p>
          <p><ShieldCheck /> GPS-Genauigkeit <span>± {Math.round(run.gpsAccuracyAvgM ?? 0)} m</span></p>
          <p><Mountain /> Höhenmeter Anstieg <span>{Math.round(run.elevationGainM ?? 0)} m</span></p>
          <p><Timer /> Pace Durchschnitt <span>{formatPace(run.pacePer100StepsSeconds)}</span></p>
          <p><ShieldCheck /> Prüfungsdetails <span>{run.validationReasons.join(" ")}</span></p>
        </GlassPanel>
        <ValidationBadge status={run.status} />
        <Button>In Rangliste eintragen</Button>
        <Button variant="secondary" icon={<Share2 />}>Bericht teilen</Button>
        <Button variant="glass" icon={<Download />} onClick={exportJson}>JSON exportieren</Button>
      </section>
    </PageShell>
  );
}
