import { Check, Footprints, LocateFixed, MapPin, Mountain, Navigation, X } from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { haversineDistanceMeters } from "../../lib/geo/geo";
import type { RunPoint } from "../../lib/types";
import { positionToRunPoint } from "./runUtils";

type WatchState = "idle" | "watching" | "error";

// iPhone Safari startet oft mit einem Wi-Fi-Fix (±50 m) und braucht 5–15 s
// bis zum echten GPS-Fix (±5–10 m). Für die Entscheidung zählt deshalb der
// genaueste Fix der letzten 10 Sekunden, nicht der erste oder der neueste.
const bestFixWindowMs = 10_000;

function pruneFixWindow(fixes: RunPoint[], next: RunPoint): RunPoint[] {
  const newestAt = new Date(next.recordedAt).getTime();
  return [
    ...fixes.filter((fix) => newestAt - new Date(fix.recordedAt).getTime() <= bestFixWindowMs),
    next
  ];
}

export function PreRunPage() {
  const { config, profile } = useApp();
  const navigate = useNavigate();
  const [state, setState] = useState<WatchState>("idle");
  const [fixes, setFixes] = useState<RunPoint[]>([]);
  const [message, setMessage] = useState("Standort noch nicht geprüft.");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const watchId = useRef<number | null>(null);

  const bestFix = useMemo(() => {
    if (fixes.length === 0) {
      return null;
    }
    return fixes.reduce((best, fix) => (fix.accuracyM < best.accuracyM ? fix : best), fixes[0]);
  }, [fixes]);

  const distanceToStart = useMemo(() => {
    if (!bestFix) {
      return null;
    }
    return haversineDistanceMeters(bestFix, { lat: config.startLat, lng: config.startLng });
  }, [bestFix, config.startLat, config.startLng]);

  // GPS-Unsicherheit darf die Startzone überlappen: effektive Distanz ist die
  // Distanz abzüglich der Genauigkeit — wer laut GPS 40 m entfernt ist, aber
  // ±30 m Unsicherheit hat, kann in der Zone stehen.
  const effectiveDistance =
    bestFix && distanceToStart !== null ? Math.max(0, distanceToStart - bestFix.accuracyM) : null;
  const accuracyOk = Boolean(bestFix && bestFix.accuracyM <= config.gpsAccuracyReviewMaxM);
  const stabilizing = Boolean(bestFix && bestFix.accuracyM > config.gpsAccuracyReviewMaxM);
  const canStart =
    accuracyOk && effectiveDistance !== null && effectiveDistance <= config.startRadiusM;

  // Alter des besten Fixes, nur für die Anzeige. Unplausible Werte (Uhr des
  // Geräts vs. Positionszeitstempel) werden verworfen statt angezeigt.
  const fixAgeSeconds = (() => {
    if (!bestFix) return null;
    const age = Math.round((nowMs - new Date(bestFix.recordedAt).getTime()) / 1000);
    return age >= 0 && age < 3600 ? age : null;
  })();
  const fixStale = fixAgeSeconds !== null && fixAgeSeconds > 25;

  function stopLocationWatch() {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }

  useEffect(() => stopLocationWatch, []);

  // Sekundentakt nur während der Ortung, damit das Alter des Fixes sichtbar
  // altert. Reine Anzeige — die Freigabe-Entscheidung hängt nicht daran.
  useEffect(() => {
    if (state !== "watching") {
      return;
    }
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  function startLocationWatch() {
    if (!navigator.geolocation) {
      setState("error");
      setMessage("Dieser Browser unterstützt keine Geolocation.");
      return;
    }

    stopLocationWatch();
    setState("watching");
    setMessage("GPS wird gestartet...");
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = positionToRunPoint(position);
        setFixes((current) => pruneFixWindow(current, next));
        setState("watching");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState("error");
          setMessage("Standortzugriff wurde abgelehnt. Bitte in den Safari-Einstellungen erlauben.");
          stopLocationWatch();
          return;
        }
        // Timeout/Position unavailable: Watch läuft weiter, GPS braucht oft
        // ein paar Sekunden bis zum ersten brauchbaren Fix.
        setMessage("GPS-Signal wird gesucht...");
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15_000 }
    );
  }

  // Erneute Prüfung: verwirft alle bisherigen Fixes (z. B. die vom falschen
  // Standort 60 m weiter) und startet die Ortung neu. Ohne diesen Knopf gab es
  // nach einem fehlgeschlagenen Check keinen Weg zurück — der einzige sichtbare
  // Knopf war das deaktivierte "Starten".
  function recheckLocation() {
    setFixes([]);
    startLocationWatch();
  }

  function startRun(needsReview: boolean) {
    stopLocationWatch();
    localStorage.setItem("tusiger.forceReview", String(needsReview));
    navigate("/run");
  }

  // Jede Zeile prüft genau eine Aussage und zeigt den gemessenen Wert dazu:
  // Standort = Fix vorhanden, GPS = Genauigkeit ausreichend, Höhe = optionaler
  // Messwert, Bewegung = Aufzeichnung aktiv, Startzone = effektive Distanz.
  const rows: Array<{ icon: typeof MapPin; label: string; text: ReactNode; ok: boolean }> = [
    {
      icon: MapPin,
      label: "Standort",
      text: bestFix
        ? `Position erfasst${fixAgeSeconds === null ? "" : ` · vor ${fixAgeSeconds} s`}${fixStale ? " — veraltet, bitte erneut prüfen" : ""}`
        : message,
      ok: Boolean(bestFix) && !fixStale
    },
    {
      icon: Navigation,
      label: "GPS",
      text: bestFix
        ? accuracyOk
          ? `± ${Math.round(bestFix.accuracyM)} m Genauigkeit`
          : `GPS stabilisiert sich... ± ${Math.round(bestFix.accuracyM)} m`
        : state === "watching"
          ? "GPS stabilisiert sich..."
          : "Noch nicht geprüft",
      ok: accuracyOk
    },
    {
      icon: Mountain,
      label: "Höhe",
      text: bestFix?.altitudeM != null ? `${Math.round(bestFix.altitudeM)} m ü. M.` : "Keine Höhendaten (optional)",
      ok: true
    },
    {
      icon: Footprints,
      label: "Bewegung",
      text: state === "watching" ? <>Bereit für GPS-<br />Aufzeichnung</> : "Startet mit dem GPS-Check",
      ok: state === "watching"
    },
    {
      icon: LocateFixed,
      label: "Startzone",
      text:
        distanceToStart === null
          ? "Unten am Start prüfen"
          : canStart
            ? `In der Startzone (${Math.round(distanceToStart)} m vom Referenzpunkt)`
            : `${Math.round(distanceToStart)} m entfernt (± ${Math.round(bestFix?.accuracyM ?? 0)} m)`,
      ok: canStart
    }
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
          <p>
            GPS: {bestFix ? `± ${Math.round(bestFix.accuracyM)} m` : "unbekannt"}
            {stabilizing ? " — stabilisiert sich..." : ""}
          </p>
        </GlassPanel>
        {state !== "watching" ? (
          <Button icon={<LocateFixed />} onClick={startLocationWatch}>Standort prüfen</Button>
        ) : (
          <>
            <Button disabled={!canStart} icon={<Footprints />} onClick={() => startRun(false)}>Starten</Button>
            <Button variant="secondary" icon={<LocateFixed />} onClick={recheckLocation}>
              Standort erneut prüfen
            </Button>
          </>
        )}
        {state === "watching" && stabilizing ? (
          <p className="pre-run-hint">GPS stabilisiert sich... ± {Math.round(bestFix?.accuracyM ?? 0)} m — ein paar Sekunden warten hilft.</p>
        ) : null}
        <button className="text-link" type="button" onClick={() => startRun(true)}>Trotzdem starten</button>
      </section>
    </PageShell>
  );
}
