import { Link, useParams } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { PageShell } from "../../components/layout/PageShell";
import { GlassPanel } from "../../components/ui/Card";

export function LegalPage() {
  const { legalPages, profile, trackEvent } = useApp();
  const { slug = "datenschutz" } = useParams();
  const language = profile?.language ?? "de";
  const page =
    legalPages.find((item) => item.slug === slug && item.language === language) ??
    legalPages.find((item) => item.slug === slug) ??
    legalPages[0];

  void trackEvent("legal_page_viewed", { slug });

  return (
    <PageShell back nav={Boolean(profile)}>
      <section className="simple-page legal-page">
        <h1>{page?.title ?? "Legal"}</h1>
        <GlassPanel>
          <p className="legal-version">Version: {page?.version ?? "draft"}</p>
          <p>{page?.body ?? "Dieser Inhalt wird vorbereitet."}</p>
        </GlassPanel>
        <GlassPanel className="legal-links">
          <Link to="/legal/datenschutz">Datenschutz</Link>
          <Link to="/legal/nutzungsbedingungen">Nutzungsbedingungen</Link>
          <Link to="/legal/impressum">Impressum</Link>
          <Link to="/legal/standort-sensoren">Standort & Sensoren</Link>
        </GlassPanel>
      </section>
    </PageShell>
  );
}
