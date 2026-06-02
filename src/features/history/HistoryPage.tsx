import { Heart, Mountain, Newspaper, UsersRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { historyFallback } from "../../data/challenge";
import { useApp } from "../../app/AppContext";

const articleUrl = "https://lenzburger-nachrichten.ch/zofingen/detail/die-born-ranger-unterhalten-seit-39-jahren-hoerbis-vermaechtnis";

export function HistoryPage({ focusDonate = false }: { focusDonate?: boolean }) {
  const donationRef = useRef<HTMLDivElement>(null);
  const { history, language, trackEvent } = useApp();
  const baseUrl = import.meta.env.BASE_URL;
  const qrImageUrl = `${baseUrl}images/twint-1000er-staegli.jpg`;
  const t = language === "en" ? {
    eyebrow: "1000er-Stägli",
    title: "Since 1904 above the A1 at Born",
    intro: "The story of the sky stairs: today 1150 steps, maintained by volunteers.",
    visual: "More than steps. An attitude.",
    rangerCaption: "The volunteer Born Rangers with (from left): Rolf Wullschleger, Hans Schürch, Kurt Hilfiker, Andy Flükiger, Bruno Muntwyler and Guido Vonäsch. Image: zvg",
    article: "Read article",
    donateTitle: "Support maintenance",
    maintenance: "Regular maintenance of the 1000er-Stägli is carried out by a volunteer working group: paths, barbecue areas, firewood, cleaning, material, transport, tools and many hours of physical work.",
    note: "The donation goes directly to the responsible volunteer working group / Born Rangers Team. Tusiger only provides the pointer.",
    qr: "Open TWINT and scan the QR code to make a donation to the Born Rangers in support of their work."
  } : {
    eyebrow: "1000er-Stägli",
    title: "Seit 1904 am Born oberhalb der A1",
    intro: "Die Geschichte der Himmelstreppe: heute 1150 Stufen, getragen vom Unterhalt durch Freiwillige.",
    visual: "Mehr als Schritte. Eine Haltung.",
    rangerCaption: "Die freiwilligen «Born-Ranger» mit (von links): Rolf Wullschleger, Hans Schürch, Kurt Hilfiker, Andy Flükiger, Bruno Muntwyler und Guido Vonäsch. Bild: zvg",
    article: "Artikel lesen",
    donateTitle: "Unterstütze den Unterhalt",
    maintenance: "Der regelmässige Unterhalt des 1000er-Stäglis wird durch eine freiwillige Arbeitsgruppe geleistet: Wege, Grillstellen, Feuerholz, Reinigung, Material, Transport, Werkzeuge und viele Stunden körperliche Arbeit.",
    note: "Die Spende geht direkt an die zuständige freiwillige Arbeitsgruppe / Born Rangers Team. Tusiger stellt nur den Hinweis bereit.",
    qr: "TWINT öffnen und QR-Code einscannen um eine Spende an die Born Rangers zur Unterstützung zu tätigen."
  };
  const localizedHistory = (history.length > 0 ? history : historyFallback).filter((item) => !item.language || item.language === language);
  const visibleHistory = localizedHistory.length > 0 ? localizedHistory : historyFallback;

  useEffect(() => {
    if (focusDonate) {
      donationRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    void trackEvent(focusDonate ? "donation_clicked" : "history_viewed");
  }, [focusDonate, trackEvent]);

  return (
    <PageShell>
      <section className="history-page">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{t.intro}</p>
        <div className="timeline">
          {visibleHistory.map((item) => (
            <GlassPanel key={item.id}>
              <span className="round-icon">{item.yearLabel === "2022" ? <UsersRound /> : <Mountain />}</span>
              <small>{item.yearLabel}</small>
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </GlassPanel>
          ))}
        </div>
        <GlassPanel className="visual-card">
          <strong>{t.visual}</strong>
          <Heart />
        </GlassPanel>
        <GlassPanel className="ranger-card">
          <img src={`${baseUrl}images/born-tusiger-rangers.webp`} alt="Born Rangers beim Unterhalt des 1000er-Stäglis" draggable={false} />
          <p>{t.rangerCaption}</p>
          <a href={articleUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary" icon={<Newspaper />}>{t.article}</Button>
          </a>
        </GlassPanel>
        <GlassPanel className="donate-card" ref={donationRef}>
          <span className="round-icon"><Heart /></span>
          <div>
            <h2>{t.donateTitle}</h2>
            <p>{t.maintenance}</p>
            <p>{t.note}</p>
          </div>
          <div className="qr-card">
            <img
              src={qrImageUrl}
              alt="TWINT QR 1000er-Stägli"
              draggable={false}
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
            <span>{t.qr}</span>
          </div>
        </GlassPanel>
      </section>
    </PageShell>
  );
}
