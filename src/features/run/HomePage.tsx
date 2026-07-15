import { BarChart3, ChevronRight, Footprints, Heart, Mountain } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../../app/AppContext";
import { Logo } from "../../components/layout/Logo";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { CelebrationTestTrigger } from "../../components/ui/Confetti";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { formatAppVersionLine } from "../../lib/appVersion";

export function HomePage() {
  const { config, language, profile, runs } = useApp();
  const navigate = useNavigate();
  const t = language === "en" ? {
    today: "Today",
    steps: "steps",
    first: "Ready for your first Tusiger.",
    keepGoing: "Keep going. Every step counts.",
    start: "Start run",
    leaderboard: "Leaderboard",
    history: "Story & donation"
  } : {
    today: "Heute",
    steps: "Stufen",
    first: "Bereit für deinen ersten Tusiger.",
    keepGoing: "Dranbleiben. Jeder Schritt zählt.",
    start: "Lauf starten",
    leaderboard: "Rangliste",
    history: "Geschichte & Spenden"
  };
  const bestRun = runs.find((run) => run.status === "valid");
  const steps = bestRun?.estimatedSteps ?? 0;

  function handleStart() {
    navigate(profile ? "/pre-run" : "/login");
  }

  return (
    <PageShell compactLogo={false}>
      <section className="hero-home">
        <CelebrationTestTrigger>
          <Logo />
        </CelebrationTestTrigger>
        <GlassPanel className="progress-card">
          <p className="eyebrow">{t.today}</p>
          <strong>{steps}</strong>
          <span>/ {config.totalSteps} {t.steps}</span>
          <div className="stairs-visual" aria-hidden>
            <i />
          </div>
          <ProgressBar value={steps} max={config.totalSteps} />
          <p className="motivation"><Mountain size={22} /> {bestRun ? t.keepGoing : t.first}</p>
        </GlassPanel>
        <Button icon={<Footprints />} onClick={handleStart}>
          {t.start}
        </Button>
        <Link className="action-row" to="/leaderboard">
          <BarChart3 aria-hidden /> {t.leaderboard} <ChevronRight aria-hidden />
        </Link>
        <Link className="action-row" to="/history">
          <Heart aria-hidden /> {t.history} <ChevronRight aria-hidden />
        </Link>
        <p className="app-version">{formatAppVersionLine(language)}</p>
      </section>
    </PageShell>
  );
}
