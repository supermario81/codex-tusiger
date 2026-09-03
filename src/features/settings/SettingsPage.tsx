import { Activity, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { isSensorLogEnabled, requestMotionPermission, setSensorLogEnabled } from "../../lib/debug/sensorLog";

export function SettingsPage() {
  const { deleteAccount } = useApp();
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
        ? "Sensor-Aufzeichnung aktiv. Der Export erscheint nach dem Lauf im Laufbericht."
        : "Bewegungsdaten wurden nicht freigegeben. In den Safari-Einstellungen erlauben."
    );
  }

  async function submitDelete(event: FormEvent) {
    event.preventDefault();
    if (confirm !== "DELETE") {
      setMessage("Bitte DELETE eingeben, um die Löschung zu bestätigen.");
      return;
    }
    await deleteAccount();
  }

  return (
    <PageShell back logoCelebrationTest>
      <section className="simple-page">
        <h1>Einstellungen</h1>
        <GlassPanel>
          <h2>Datenschutz</h2>
          <p>Öffentlich sichtbar sind nur Nickname, Avatar und gültige Laufzeiten. Deine E-Mail wird nie öffentlich angezeigt.</p>
          <p>GPS wird nur während Pre-Run und Lauf verwendet. Aktive Läufe werden lokal zwischengespeichert, damit keine Daten verloren gehen.</p>
          <div className="legal-link-list">
            <Link to="/legal/datenschutz">Datenschutzrichtlinie</Link>
            <Link to="/legal/nutzungsbedingungen">Nutzungsbedingungen</Link>
            <Link to="/legal/impressum">Impressum</Link>
            <Link to="/legal/standort-sensoren">Standort-/Sensor-Einwilligung</Link>
          </div>
        </GlassPanel>
        <GlassPanel>
          <h2>Entwickler-Werkzeuge</h2>
          <p>
            Zeichnet während eines Laufs die verfügbaren Gerätesensoren auf (Beschleunigung,
            Gyroskop, Kompass, GPS) und stellt sie im Laufbericht als CSV zum Export bereit.
            Nur für Testläufe gedacht — im Normalbetrieb ausgeschaltet lassen.
          </p>
          <label className="toggle-line">
            <span><strong><Activity size={18} aria-hidden /> Sensordaten aufzeichnen</strong></span>
            <input
              type="checkbox"
              checked={sensorLogging}
              onChange={(event) => void toggleSensorLogging(event.currentTarget.checked)}
            />
          </label>
          {sensorNote ? <small>{sensorNote}</small> : null}
        </GlassPanel>
        <GlassPanel>
          <h2>Account löschen</h2>
          <p>Dein Profil wird anonymisiert, Gruppenmitgliedschaften werden entfernt und die lokale Session wird beendet. Vollständige Auth-User-Löschung benötigt eine serverseitige Admin-Funktion.</p>
          <form onSubmit={submitDelete}>
            <label className="input-wrap">
              <span>Zur Bestätigung DELETE eingeben</span>
              <input value={confirm} onChange={(event) => setConfirm(event.currentTarget.value)} />
            </label>
            {message ? <p className="form-error">{message}</p> : null}
            <Button variant="danger" icon={<Trash2 />}>Account anonymisieren</Button>
          </form>
        </GlassPanel>
      </section>
    </PageShell>
  );
}
