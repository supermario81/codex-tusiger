import { Heart, Mountain, UsersRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { historyFallback } from "../../data/challenge";
import { useApp } from "../../app/AppContext";

export function HistoryPage({ focusDonate = false }: { focusDonate?: boolean }) {
  const donationRef = useRef<HTMLDivElement>(null);
  const { config } = useApp();

  useEffect(() => {
    if (focusDonate) {
      donationRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [focusDonate]);

  return (
    <PageShell>
      <section className="history-page">
        <p className="eyebrow">Unsere Geschichte</p>
        <h1>Geschichte des Tusigers</h1>
        <p>Aus einer Idee unter Freunden wurde eine Bewegung. Für mehr Achtsamkeit, Gemeinschaft und persönliches Wachstum.</p>
        <div className="timeline">
          {historyFallback.map((item) => (
            <GlassPanel key={item.id}>
              <span className="round-icon">{item.yearLabel === "2022" ? <UsersRound /> : <Mountain />}</span>
              <small>{item.yearLabel}</small>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </GlassPanel>
          ))}
        </div>
        <GlassPanel className="visual-card">
          <strong>Mehr als Schritte. Eine Haltung.</strong>
          <Heart />
        </GlassPanel>
        <GlassPanel className="donate-card" ref={donationRef}>
          <span className="round-icon"><Heart /></span>
          <div>
            <h2>Unterstütze den Verein</h2>
            <p>Deine Spende hilft uns, neue Projekte zu realisieren, Events zu ermöglichen und die Community zu stärken.</p>
          </div>
          <a href={config.donationUrl} target="_blank" rel="noreferrer"><Button>Jetzt spenden</Button></a>
        </GlassPanel>
      </section>
    </PageShell>
  );
}
