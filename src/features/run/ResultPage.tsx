import { Download, Flag, LocateFixed, Map, Mountain, Share2, ShieldCheck, Timer } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { formatDuration, formatPace } from "../../lib/geo/geo";
import { localStore } from "../../lib/storage/localStore";

function checkVerdictLabel(level: "pass" | "review" | "fail") {
  return level === "pass" ? "erfüllt" : level === "review" ? "Prüfung" : "nicht erfüllt";
}

export function ResultPage() {
  const { runId } = useParams();
  const { config, runs } = useApp();
  const storedRun = useMemo(
    () => runId ? localStore.readRuns().find((item) => item.id === runId) ?? null : null,
    [runId]
  );
  // Lokale Kopie bevorzugen: sie enthält Punkte und Checks, die Supabase-Zeile nicht.
  const contextRun = runs.find((item) => item.id === runId);
  const run = storedRun && storedRun.points.length > 0 ? storedRun : contextRun ?? storedRun;

  if (!run) {
    return (
      <PageShell back>
        <section className="simple-page"><h1>Laufbericht</h1><p>Noch kein Lauf vorhanden.</p></section>
      </PageShell>
    );
  }

  const selectedRun = run;
  const validationLabel =
    selectedRun.status === "valid" ? "Validiert" : selectedRun.status === "invalid" ? "Ungültig" : "Prüfung";
  const confidenceText = selectedRun.trackingSummary
    ? `${Math.round(selectedRun.trackingSummary.averageConfidence * 100)} % · ${Math.round(selectedRun.trackingSummary.routeAdherenceRatio * 100)} % Korridor`
    : "nicht verfügbar";

  function exportJson() {
    // Diagnose-Export für Feldtests: kompletter Lauf inkl. aller Punkte,
    // Validierungs-Checks, stabiler Referenzen und der aktiven Konfiguration.
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "tusiger",
      challengeConfig: config,
      pointCount: selectedRun.points.length,
      stableReferences: {
        start: { lat: selectedRun.startLat, lng: selectedRun.startLng },
        end: { lat: selectedRun.endLat, lng: selectedRun.endLng }
      },
      validationChecks: selectedRun.validationChecks ?? [],
      run: selectedRun
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tusiger-run-${selectedRun.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell back nav={false}>
      <section className="result-page">
        <h1>Laufbericht</h1>
        <p>{new Date(selectedRun.startedAt).toLocaleString("de-CH")}</p>
        <GlassPanel className="metric-grid">
          <MetricCard icon={<Timer />} label="Gesamtzeit" value={formatDuration(selectedRun.durationSeconds)} meta="hh:mm:ss" />
          <MetricCard icon={<Flag />} label="Stufen" value={String(selectedRun.estimatedSteps)} meta="Schritte" />
          <MetricCard icon={<Mountain />} label="Höhenmeter" value={`${Math.round(selectedRun.elevationGainM ?? 0)} m`} meta="Anstieg" />
          <MetricCard icon={<ShieldCheck />} label="Validierung" value={validationLabel} meta="GPS & Regeln" />
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
          <p><LocateFixed /> Startkoordinaten <span>{selectedRun.startLat?.toFixed(6)}, {selectedRun.startLng?.toFixed(6)}</span></p>
          <p><Flag /> Zielkoordinaten <span>{selectedRun.endLat?.toFixed(6)}, {selectedRun.endLng?.toFixed(6)}</span></p>
          <p><ShieldCheck /> GPS-Genauigkeit <span>± {Math.round(selectedRun.gpsAccuracyAvgM ?? 0)} m</span></p>
          <p><Mountain /> Höhenmeter Anstieg <span>{Math.round(selectedRun.elevationGainM ?? 0)} m</span></p>
          {selectedRun.trackingSummary?.cumulativeAscentM != null ? (
            <p><Mountain /> Kumulativer Anstieg <span>{Math.round(selectedRun.trackingSummary.cumulativeAscentM)} m</span></p>
          ) : null}
          <p><Timer /> Pace Durchschnitt <span>{formatPace(selectedRun.pacePer100StepsSeconds)}</span></p>
          <p><ShieldCheck /> Signalqualität <span>{confidenceText}</span></p>
        </GlassPanel>
        <GlassPanel className="details-list">
          <h2>Prüfungsdetails</h2>
          {selectedRun.validationChecks?.length ? (
            selectedRun.validationChecks.map((check) => (
              <p key={check.rule} className="check-row">
                <ShieldCheck />
                <span className="check-text">
                  <strong>{check.label}</strong>
                  <small>{check.measured}</small>
                </span>
                <b className={`check-verdict-${check.level}`}>{checkVerdictLabel(check.level)}</b>
              </p>
            ))
          ) : (
            <p><ShieldCheck /> Prüfungsdetails <span>{selectedRun.validationReasons.join(" ")}</span></p>
          )}
        </GlassPanel>
        <ValidationBadge status={selectedRun.status} />
        <Link to="/leaderboard"><Button>In Rangliste ansehen</Button></Link>
        <Button variant="secondary" icon={<Share2 />}>Bericht teilen</Button>
        <Button variant="glass" icon={<Download />} onClick={exportJson}>JSON exportieren</Button>
      </section>
    </PageShell>
  );
}
