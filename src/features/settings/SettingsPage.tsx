import { Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";

export function SettingsPage() {
  const { deleteAccount } = useApp();
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

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
