import { Activity, Download, Flag, LocateFixed, Map, Mountain, Share2, ShieldCheck, Timer } from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { MetricCard } from "../../components/ui/MetricCard";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { getAppBaseUrl } from "../../lib/community/community";
import { formatDuration, formatPace } from "../../lib/geo/geo";
import { translateCheck } from "../../lib/validation/translateCheck";
import { localStore } from "../../lib/storage/localStore";
import { sensorLog } from "../../lib/debug/sensorLog";

export function ResultPage() {
  const { runId } = useParams();
  const { config, runs, userId, t, language } = useApp();
  const storedRun = useMemo(
    () => runId ? localStore.readRuns(userId).find((item) => item.id === runId) ?? null : null,
    [runId, userId]
  );
  // Die vollständigere Quelle gewinnt: die lokale Kopie hat Punkte und
  // Prüfdetails, die Supabase-Zeile nur die Kennzahlen (bis Migration 0009).
  const contextRun = runs.find((item) => item.id === runId);
  const localHasDetail = Boolean(storedRun && (storedRun.points.length > 0 || storedRun.validationChecks?.length));
  const run = localHasDetail ? storedRun : contextRun ?? storedRun;

  if (!run) {
    return (
      <PageShell back>
        <section className="simple-page"><h1>{t("Laufbericht", "Run report")}</h1><p>{t("Noch kein Lauf vorhanden.", "No run available yet.")}</p></section>
      </PageShell>
    );
  }

  const selectedRun = run;
  const validationLabel =
    selectedRun.status === "valid" ? t("Validiert", "Validated") : selectedRun.status === "invalid" ? t("Ungültig", "Invalid") : t("Prüfung", "In review");
  const hasSensorLog = sensorLog.hasDataFor(selectedRun.id);
  const confidenceText = selectedRun.trackingSummary
    ? `${Math.round(selectedRun.trackingSummary.averageConfidence * 100)} % · ${Math.round(selectedRun.trackingSummary.routeAdherenceRatio * 100)} % ${t("Korridor", "corridor")}`
    : t("nicht verfügbar", "not available");

  function downloadFile(content: string, fileName: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportSensorCsv() {
    downloadFile(sensorLog.toCsv(), `tusiger-sensors-${selectedRun.id}.csv`, "text/csv");
  }

  function exportLabelsCsv() {
    downloadFile(sensorLog.toLabelsCsv(), `tusiger-labels-${selectedRun.id}.csv`, "text/csv");
  }

  async function shareReport() {
    const time = formatDuration(selectedRun.durationSeconds);
    const text = t(
      `${selectedRun.estimatedSteps} Stufen in ${time} — mein Tusiger-Lauf.`,
      `${selectedRun.estimatedSteps} steps in ${time} — my Tusiger run.`
    );
    const url = getAppBaseUrl();
    if (navigator.share) {
      // Abbruch im Teilen-Dialog ist kein Fehler.
      await navigator.share({ title: "Tusiger", text, url }).catch(() => undefined);
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank", "noopener");
    }
  }

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
        <h1>{t("Laufbericht", "Run report")}</h1>
        <p>{new Date(selectedRun.startedAt).toLocaleString(language === "en" ? "en-GB" : "de-CH")}</p>
        <GlassPanel className="metric-grid">
          <MetricCard icon={<Timer />} label={t("Gesamtzeit", "Total time")} value={formatDuration(selectedRun.durationSeconds)} meta="hh:mm:ss" />
          <MetricCard icon={<Flag />} label={t("Stufen", "Steps")} value={String(selectedRun.estimatedSteps)} meta={t("Schritte", "Steps")} />
          <MetricCard icon={<Mountain />} label={t("Höhenmeter", "Elevation")} value={`${Math.round(selectedRun.elevationGainM ?? 0)} m`} meta={t("Anstieg", "Ascent")} />
          <MetricCard icon={<ShieldCheck />} label={t("Validierung", "Validation")} value={validationLabel} meta={t("GPS & Regeln", "GPS & rules")} />
        </GlassPanel>
        <GlassPanel className="route-card">
          <h2>Route <span><Map size={18} /> {t("Karte", "Map")}</span></h2>
          <svg viewBox="0 0 420 140" role="img" aria-label={t("Routenlinie", "Route line")}>
            <path d="M20 95 C70 92, 92 110, 138 86 S205 73, 234 88 S300 58, 350 48 S380 72, 402 62" />
            <circle cx="20" cy="95" r="8" />
            <path d="M390 42 v42 m0-42 l24 9 -24 9" />
          </svg>
        </GlassPanel>
        <GlassPanel className="details-list">
          <h2>Details</h2>
          <p><LocateFixed /> {t("Startkoordinaten", "Start coordinates")} <span>{selectedRun.startLat?.toFixed(6)}, {selectedRun.startLng?.toFixed(6)}</span></p>
          <p><Flag /> {t("Zielkoordinaten", "Finish coordinates")} <span>{selectedRun.endLat?.toFixed(6)}, {selectedRun.endLng?.toFixed(6)}</span></p>
          <p><ShieldCheck /> {t("GPS-Genauigkeit", "GPS accuracy")} <span>± {Math.round(selectedRun.gpsAccuracyAvgM ?? 0)} m</span></p>
          <p><Mountain /> {t("Höhenmeter Anstieg", "Elevation gain")} <span>{Math.round(selectedRun.elevationGainM ?? 0)} m</span></p>
          {selectedRun.trackingSummary?.cumulativeAscentM != null ? (
            <p><Mountain /> {t("Kumulativer Anstieg", "Cumulative ascent")} <span>{Math.round(selectedRun.trackingSummary.cumulativeAscentM)} m</span></p>
          ) : null}
          <p><Timer /> {t("Pace Durchschnitt", "Average pace")} <span>{formatPace(selectedRun.pacePer100StepsSeconds, language)}</span></p>
          <p><ShieldCheck /> {t("Signalqualität", "Signal quality")} <span>{confidenceText}</span></p>
        </GlassPanel>
        <GlassPanel className="details-list">
          <h2>{t("Prüfungsdetails", "Validation details")}</h2>
          {selectedRun.validationChecks?.length ? (
            selectedRun.validationChecks.map((check) => (
              <p key={check.rule} className="check-row">
                <ShieldCheck />
                <span className="check-text">
                  <strong>{translateCheck(check.label, language)}</strong>
                  <small>{translateCheck(check.measured, language)}</small>
                </span>
                <b className={`check-verdict-${check.level}`}>{check.level === "pass" ? t("erfüllt", "passed") : check.level === "review" ? t("Prüfung", "review") : t("nicht erfüllt", "failed")}</b>
              </p>
            ))
          ) : (
            <p><ShieldCheck /> {t("Prüfungsdetails", "Validation details")} <span>{selectedRun.validationReasons.map((reason) => translateCheck(reason, language)).join(" ")}</span></p>
          )}
        </GlassPanel>
        <ValidationBadge status={selectedRun.status} />
        <Link to="/leaderboard"><Button>{t("In Rangliste ansehen", "View in leaderboard")}</Button></Link>
        <Button variant="secondary" icon={<Share2 />} onClick={() => void shareReport()}>{t("Bericht teilen", "Share report")}</Button>
        <Button variant="glass" icon={<Download />} onClick={exportJson}>{t("JSON exportieren", "Export JSON")}</Button>
        {hasSensorLog ? (
          <>
            <GlassPanel className="details-list">
              <h2>{t("Sensor-Vergleich", "Sensor comparison")}</h2>
              <p>
                <Activity /> {t("Stufen laut GPS und Routenmodell", "Steps from GPS and route model")}
                <span>{selectedRun.estimatedSteps}</span>
              </p>
              <p>
                <Activity /> {t("Tritte laut Beschleunigung", "Footfalls from acceleration")}
                <span>{sensorLog.detectedStepCount}</span>
              </p>
              <p>
                <Activity /> {t("Stufen aus Tritten und Routenmodell", "Steps from footfalls and route model")}
                <span>{sensorLog.fusedStepCount}</span>
              </p>
              <p className="check-row">
                <Activity />
                <span className="check-text">
                  <strong>{t("Noch kein Wertungskriterium", "Not used for ranking yet")}</strong>
                  <small>
                      {t(
                        "Der Sensor zählt Tritte, nicht Stufen — auf stufenlosen Wegen und je nach Steilheit weicht beides ab. Die dritte Zeile rechnet die Tritte mit dem gemessenen Faktor je Abschnitt um. Sie läuft mit, bis normale Läufe die Faktoren bestätigen.",
                        "The sensor counts footfalls, not steps — they differ on step-free paths and with steepness. The third line converts footfalls using the measured factor per section. It runs alongside until normal runs confirm the factors."
                      )}
                    </small>
                </span>
              </p>
            </GlassPanel>
            <Button variant="glass" icon={<Activity />} onClick={exportSensorCsv}>
              {t("Sensordaten als CSV", "Sensor data as CSV")} ({sensorLog.sampleCount} {t("Messungen", "samples")})
            </Button>
            <Button variant="glass" icon={<Download />} onClick={exportLabelsCsv}>
              {t("Label-Vorlage als CSV", "Label template as CSV")}
            </Button>
          </>
        ) : null}
      </section>
    </PageShell>
  );
}
