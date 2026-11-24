import { Activity, Footprints, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { isSensorLogEnabled, requestMotionPermission, setSensorLogEnabled } from "../../lib/debug/sensorLog";

export function SettingsPage() {
  const { deleteAccount, t } = useApp();
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [sensorLogging, setSensorLogging] = useState(() => isSensorLogEnabled());
  const [sensorNote, setSensorNote] = useState("");

  // Der Schalter fragt die iOS-Bewegungsfreigabe direkt aus dem Tap heraus an —
  // Safari erlaubt das nur innerhalb einer Nutzergeste.
  async function toggleSensorLogging(nextValue: boolean) {
    setSensorNote("");
    if (!nextValue) {
      setSensorLogEnabled(false);
      setSensorLogging(false);
      return;
    }
    const granted = await requestMotionPermission();
    setSensorLogEnabled(granted);
    setSensorLogging(granted);
    setSensorNote(
      granted
        ? t("Sensor-Aufzeichnung aktiv. Der Export erscheint nach dem Lauf im Laufbericht.", "Sensor recording active. The export appears in the run report after the run.")
        : t("Bewegungsdaten wurden nicht freigegeben. In den Safari-Einstellungen erlauben.", "Motion data was not granted. Allow it in the Safari settings.")
    );
  }

  async function submitDelete(event: FormEvent) {
    event.preventDefault();
    if (confirm !== "DELETE") {
      setMessage(t("Bitte DELETE eingeben, um die Löschung zu bestätigen.", "Please type DELETE to confirm deletion."));
      return;
    }
    try {
      await deleteAccount();
    } catch {
      setMessage(t("Account konnte nicht gelöscht werden. Bitte erneut versuchen.", "Account could not be deleted. Please try again."));
    }
  }

  return (
    <PageShell back logoCelebrationTest>
      <section className="simple-page">
        <h1>{t("Einstellungen", "Settings")}</h1>
        <GlassPanel>
          <h2>{t("Datenschutz", "Privacy")}</h2>
          <p>{t("Öffentlich sichtbar sind nur Nickname, Avatar und gültige Laufzeiten. Deine E-Mail wird nie öffentlich angezeigt.", "Only nickname, avatar and valid run times are publicly visible. Your email is never shown publicly.")}</p>
          <p>{t("GPS wird nur während Pre-Run und Lauf verwendet. Aktive Läufe werden lokal zwischengespeichert, damit keine Daten verloren gehen.", "GPS is only used during the pre-run check and the run. Active runs are stored locally so no data is lost.")}</p>
          <div className="legal-link-list">
            <Link to="/legal/datenschutz">{t("Datenschutzrichtlinie", "Privacy Policy")}</Link>
            <Link to="/legal/nutzungsbedingungen">{t("Nutzungsbedingungen", "Terms of Use")}</Link>
            <Link to="/legal/impressum">{t("Impressum", "Imprint")}</Link>
            <Link to="/legal/standort-sensoren">{t("Standort-/Sensor-Einwilligung", "Location/Sensor Consent")}</Link>
          </div>
        </GlassPanel>
        <GlassPanel>
          <h2>{t("Entwickler-Werkzeuge", "Developer tools")}</h2>
          <p>{t("Zeichnet während eines Laufs die verfügbaren Gerätesensoren auf (Beschleunigung, Gyroskop, Kompass, GPS) und stellt sie im Laufbericht als CSV zum Export bereit. Nur für Testläufe gedacht — im Normalbetrieb ausgeschaltet lassen.", "Records the available device sensors during a run (acceleration, gyroscope, compass, GPS) and offers them as CSV in the run report. For test runs only — leave it off in normal use.")}</p>
          <label className="toggle-line">
            <span><strong><Activity size={18} aria-hidden /> {t("Sensordaten aufzeichnen", "Record sensor data")}</strong></span>
            <input
              type="checkbox"
              checked={sensorLogging}
              onChange={(event) => void toggleSensorLogging(event.currentTarget.checked)}
            />
          </label>
          {sensorNote ? <small>{sensorNote}</small> : null}
          <p>{t("Für die Streckenvermessung: einmal abgehen und jeden Übergang zwischen Treppe und stufenlosem Weg markieren. Daraus entsteht das Routenmodell mit exakter Stufenzahl je Abschnitt.", "For surveying the route: walk it once and mark every transition between stairs and step-free path. This creates the route model with exact step counts per section.")}</p>
          <Link className="action-row" to="/calibration"><Footprints /> {t("Streckenkalibrierung", "Route calibration")}</Link>
        </GlassPanel>
        <GlassPanel>
          <h2>{t("Account löschen", "Delete account")}</h2>
          <p>{t("Dein Konto, dein Profil, alle Läufe samt GPS-Daten und deine Gruppenmitgliedschaften werden endgültig gelöscht. Das lässt sich nicht rückgängig machen.", "Your account, profile, all runs including GPS data and your group memberships will be permanently deleted. This cannot be undone.")}</p>
          <form onSubmit={submitDelete}>
            <label className="input-wrap">
              <span>{t("Zur Bestätigung DELETE eingeben", "Type DELETE to confirm")}</span>
              <input value={confirm} onChange={(event) => setConfirm(event.currentTarget.value)} />
            </label>
            {message ? <p className="form-error">{message}</p> : null}
            <Button variant="danger" icon={<Trash2 />}>{t("Account löschen", "Delete account")}</Button>
          </form>
        </GlassPanel>
      </section>
    </PageShell>
  );
}
