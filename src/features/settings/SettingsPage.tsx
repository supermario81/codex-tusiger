import { Trash2 } from "lucide-react";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";

export function SettingsPage() {
  return (
    <PageShell back>
      <section className="simple-page">
        <h1>Einstellungen</h1>
        <GlassPanel>
          <h2>Datenschutz</h2>
          <p>Öffentlich sichtbar sind nur Nickname, Avatar und gültige Laufzeiten. Deine E-Mail wird nie öffentlich angezeigt.</p>
          <p>GPS wird nur während Pre-Run und Lauf verwendet. Aktive Läufe werden lokal zwischengespeichert, damit keine Daten verloren gehen.</p>
        </GlassPanel>
        <Button variant="danger" icon={<Trash2 />}>Account löschen (TODO Produktion)</Button>
      </section>
    </PageShell>
  );
}
