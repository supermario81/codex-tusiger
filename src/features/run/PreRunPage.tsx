import { Check, Footprints, LocateFixed, MapPin, Mountain, Navigation, X } from "lucide-react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isSensorLogEnabled, requestMotionPermission } from "../../lib/debug/sensorLog";
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
  const { config, profile, t, language } = useApp();
  const navigate = useNavigate();
  const [state, setState] = useState<WatchState>("idle");
  const [fixes, setFixes] = useState<RunPoint[]>([]);
  const [message, setMessage] = useState<[string, string]>(["Standort noch nicht geprüft.", "Location not checked yet."]);
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
      setMessage(["Dieser Browser unterstützt keine Geolocation.", "This browser does not support geolocation."]);
      return;
    }

    stopLocationWatch();
    setState("watching");
    setMessage(["GPS wird gestartet...", "Starting GPS..."]);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = positionToRunPoint(position);
        setFixes((current) => pruneFixWindow(current, next));
        setState("watching");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setState("error");
          setMessage(["Standortzugriff wurde abgelehnt. Bitte in den Safari-Einstellungen erlauben.", "Location access was denied. Please allow it in the Safari settings."]);
          stopLocationWatch();
          return;
        }
        // Timeout/Position unavailable: Watch läuft weiter, GPS braucht oft
        // ein paar Sekunden bis zum ersten brauchbaren Fix.
        setMessage(["GPS-Signal wird gesucht...", "Searching for GPS signal..."]);
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
    // iOS vergisst die Bewegungsfreigabe beim Neuladen und fragt nur aus einer Geste.
    if (isSensorLogEnabled()) void requestMotionPermission();
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
      label: t("Standort", "Location"),
      text: bestFix
        ? `${t("Position erfasst", "Position found")}${fixAgeSeconds === null ? "" : ` · ${t(`vor ${fixAgeSeconds} s`, `${fixAgeSeconds} s ago`)}`}${fixStale ? t(" — veraltet, bitte erneut prüfen", " — outdated, please check again") : ""}`
        : t(...message),
      ok: Boolean(bestFix) && !fixStale
    },
    {
      icon: Navigation,
      label: "GPS",
      text: bestFix
        ? accuracyOk
          ? `± ${Math.round(bestFix.accuracyM)} m ${t("Genauigkeit", "accuracy")}`
          : `${t("GPS stabilisiert sich...", "GPS is stabilising...")} ± ${Math.round(bestFix.accuracyM)} m`
        : state === "watching"
          ? t("GPS stabilisiert sich...", "GPS is stabilising...")
          : t("Noch nicht geprüft", "Not checked yet"),
      ok: accuracyOk
    },
    {
      icon: Mountain,
      label: t("Höhe", "Altitude"),
      text: bestFix?.altitudeM != null ? `${Math.round(bestFix.altitudeM)} m ${t("ü. M.", "a.s.l.")}` : t("Keine Höhendaten (optional)", "No altitude data (optional)"),
      ok: true
    },
    {
      icon: Footprints,
      label: t("Bewegung", "Motion"),
      text: state === "watching" ? language === "en" ? "Ready for GPS recording" : <>Bereit für GPS-<br />Aufzeichnung</> : t("Startet mit dem GPS-Check", "Starts with the GPS check"),
      ok: state === "watching"
    },
    {
      icon: LocateFixed,
      label: t("Startzone", "Start zone"),
      text:
        distanceToStart === null
          ? t("Unten am Start prüfen", "Check at the bottom start")
          : canStart
            ? t(`In der Startzone (${Math.round(distanceToStart)} m vom Referenzpunkt)`, `In the start zone (${Math.round(distanceToStart)} m from the reference point)`)
            : `${Math.round(distanceToStart)} m ${t("entfernt", "away")} (± ${Math.round(bestFix?.accuracyM ?? 0)} m)`,
      ok: canStart
    }
  ];

  return (
    <PageShell back nav={false}>
      <section className="pre-run">
        <h1>{t("Bereit zum Start?", "Ready to start?")}</h1>
        <p>{t("Dein Pre-Run Check", "Your pre-run check")}</p>
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
            <small>{t("Startzone", "Start zone")}</small>
            <strong>{t("Start unten", "Start at the bottom")}</strong>
            <span>Zone<br />{canStart ? t("aktiv", "active") : t("noch nicht aktiv", "not active yet")}</span>
          </div>
          <p>
            GPS: {bestFix ? `± ${Math.round(bestFix.accuracyM)} m` : t("unbekannt", "unknown")}
            {stabilizing ? t(" — stabilisiert sich...", " — stabilising...") : ""}
          </p>
        </GlassPanel>
        <p className="pre-run-hint"><strong>{t("Handy während des Laufs nicht sperren.", "Do not lock your phone during the run.")}</strong> {t("Sonst stoppt die Aufzeichnung.", "Otherwise recording stops.")}</p>
        {state !== "watching" ? (
          <Button icon={<LocateFixed />} onClick={startLocationWatch}>{t("Standort prüfen", "Check location")}</Button>
        ) : (
          <>
            <Button disabled={!canStart} icon={<Footprints />} onClick={() => startRun(false)}>{t("Starten", "Start")}</Button>
            <Button variant="secondary" icon={<LocateFixed />} onClick={recheckLocation}>
              {t("Standort erneut prüfen", "Check location again")}
            </Button>
          </>
        )}
        {state === "watching" && stabilizing ? (
          <p className="pre-run-hint">{t("GPS stabilisiert sich...", "GPS is stabilising...")} ± {Math.round(bestFix?.accuracyM ?? 0)} m — {t("ein paar Sekunden warten hilft.", "waiting a few seconds helps.")}</p>
        ) : null}
        <button className="text-link" type="button" onClick={() => startRun(true)}>{t("Trotzdem starten", "Start anyway")}</button>
      </section>
    </PageShell>
  );
}
