import { Check, Footprints, LocateFixed, MapPin, Mountain, Navigation, X } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { haversineDistanceMeters } from "../../lib/geo/geo";
import type { RunPoint } from "../../lib/types";
import { positionToRunPoint } from "./runUtils";

type PermissionState = "idle" | "loading" | "ready" | "warning" | "error";

export function PreRunPage() {
  const { config, profile } = useApp();
  const navigate = useNavigate();
  const [state, setState] = useState<PermissionState>("idle");
  const [point, setPoint] = useState<RunPoint | null>(null);
  const [message, setMessage] = useState("Standort noch nicht geprüft.");

  const distanceToStart = useMemo(() => {
    if (!point) {
      return null;
    }
    return haversineDistanceMeters(point, { lat: config.startLat, lng: config.startLng });
  }, [config.startLat, config.startLng, point]);

  const canStart =
    point !== null &&
    distanceToStart !== null &&
    distanceToStart <= config.startRadiusM &&
    point.accuracyM <= config.gpsAccuracyValidMaxM;

  useEffect(() => {
    return () => setState((current) => (current === "loading" ? "idle" : current));
  }, []);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  function requestLocation() {
    setState("loading");
    setMessage("Standort wird angefragt...");
    if (!navigator.geolocation) {
      setState("error");
      setMessage("Dieser Browser unterstützt keine Geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = positionToRunPoint(position);
        setPoint(next);
        const distance = haversineDistanceMeters(next, { lat: config.startLat, lng: config.startLng });
        setState(distance <= config.startRadiusM && next.accuracyM <= config.gpsAccuracyValidMaxM ? "ready" : "warning");
        setMessage("Standort erfolgreich geprüft.");
      },
      (error) => {
        setState("error");
        setMessage(error.message || "Standort wurde abgelehnt.");
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 3_000 }
    );
  }

  function startRun(needsReview: boolean) {
    localStorage.setItem("tusiger.forceReview", String(needsReview));
    navigate("/run");
  }

  const rows: Array<{ icon: typeof MapPin; label: string; text: ReactNode; ok: boolean }> = [
    { icon: MapPin, label: "Standort", text: point ? "Olten, Schweiz" : message, ok: state === "ready" },
    { icon: Navigation, label: "GPS", text: point ? `± ${Math.round(point.accuracyM)} m Genauigkeit` : "Noch nicht geprüft", ok: Boolean(point && point.accuracyM <= config.gpsAccuracyValidMaxM) },
    { icon: Mountain, label: "Höhe", text: point?.altitudeM ? `${Math.round(point.altitudeM)} m ü. M.` : "Höhe optional", ok: true },
    { icon: Footprints, label: "Bewegung", text: <>Bereit für GPS-<br />Aufzeichnung</>, ok: true },
    { icon: LocateFixed, label: "Startzone", text: distanceToStart === null ? "Unten am Start prüfen" : `${Math.round(distanceToStart)} m entfernt`, ok: canStart }
  ];

  return (
    <PageShell back nav={false}>
      <section className="pre-run">
        <h1>Bereit zum Start?</h1>
        <p>Dein Pre-Run Check</p>
        <GlassPanel className="check-list">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <article key={row.label}>
                <span className="round-icon"><Icon aria-hidden /></span>
                <div><strong>{row.label}</strong><small>{row.text}</small></div>
                <span className={`check-dot ${row.ok ? "ok" : "warn"}`}>{row.ok ? <Check /> : <X />}</span>
              </article>
            );
          })}
        </GlassPanel>
        <GlassPanel className="zone-card">
          <div className="map-placeholder"><MapPin /></div>
          <div>
            <small>Startzone</small>
            <strong>Start unten</strong>
            <span>Zone<br />{canStart ? "aktiv" : "noch nicht aktiv"}</span>
          </div>
          <p>GPS: {point ? `± ${Math.round(point.accuracyM)} m` : "unbekannt"}</p>
        </GlassPanel>
        {!point ? (
          <Button icon={<LocateFixed />} onClick={requestLocation}>Standort prüfen</Button>
        ) : (
          <Button disabled={!canStart} icon={<Footprints />} onClick={() => startRun(false)}>Starten</Button>
        )}
        <button className="text-link" type="button" onClick={() => startRun(true)}>Trotzdem starten</button>
      </section>
    </PageShell>
  );
}
