import { ExternalLink, Heart, Mountain, UsersRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { historyFallback } from "../../data/challenge";
import { useApp } from "../../app/AppContext";

export function HistoryPage({ focusDonate = false }: { focusDonate?: boolean }) {
  const donationRef = useRef<HTMLDivElement>(null);
  const { config, history, trackEvent } = useApp();

  useEffect(() => {
    if (focusDonate) {
      donationRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    void trackEvent(focusDonate ? "donation_clicked" : "history_viewed");
  }, [focusDonate, trackEvent]);

  return (
    <PageShell>
      <section className="history-page">
        <p className="eyebrow">1000er-Stägli</p>
        <h1>Seit 1904 am Born oberhalb der A1</h1>
        <p>Die Geschichte der Himmelstreppe: heute 1150 Stufen, getragen vom Unterhalt durch Freiwillige.</p>
        <div className="timeline">
          {(history.length > 0 ? history : historyFallback).map((item) => (
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
            <h2>Unterstütze den Unterhalt</h2>
            <p>Der regelmässige Unterhalt des 1000er-Stäglis wird durch eine freiwillige Arbeitsgruppe geleistet: Wege, Grillstellen, Feuerholz, Reinigung, Material, Transport, Werkzeuge und viele Stunden körperliche Arbeit.</p>
            <p>Die Spende geht direkt an die zuständige freiwillige Arbeitsgruppe / Born Rangers Team. Tusiger stellt nur den Hinweis bereit.</p>
          </div>
          <div className="qr-card">
            <img src={`${import.meta.env.BASE_URL}images/twint-1000er-staegli.jpg`} alt="TWINT QR 1000er-Stägli" />
            <span>TWINT QR vom offiziellen Flyer</span>
          </div>
          <a href={config.donationUrl || `${import.meta.env.BASE_URL}images/twint-1000er-staegli.jpg`} target="_blank" rel="noreferrer">
            <Button icon={<ExternalLink />}>Jetzt per TWINT unterstützen</Button>
          </a>
        </GlassPanel>
      </section>
    </PageShell>
  );
}
