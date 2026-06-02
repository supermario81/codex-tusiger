import { BarChart3, Check, Trophy } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { PageShell } from "../../components/layout/PageShell";
import { Button } from "../../components/ui/Button";
import { GlassPanel } from "../../components/ui/Card";
import { ValidationBadge } from "../../components/ui/StatusBadge";
import { localStore } from "../../lib/storage/localStore";
import { formatDuration } from "../../lib/geo/geo";
import { useApp } from "../../app/AppContext";
import { useEffect } from "react";

function playFanfare() {
  const audioFile = `${import.meta.env.BASE_URL}audio/victory.mp3`;
  const audio = new Audio(audioFile);
  audio.volume = 0.6;
  void audio.play().catch(() => {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0, dur: 0.2 },
      { freq: 659.25, start: 0.22, dur: 0.2 },
      { freq: 783.99, start: 0.44, dur: 0.2 },
      { freq: 1046.5, start: 0.66, dur: 0.7 },
      { freq: 783.99, start: 0.68, dur: 0.68 },
      { freq: 659.25, start: 0.7, dur: 0.66 }
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.22, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  });
}

export function FinishPage() {
  const { config } = useApp();
  const runId = localStorage.getItem("tusiger.lastRunId");
  const run = localStore.readRuns().find((item) => item.id === runId);

  useEffect(() => {
    playFanfare();
  }, []);

  if (!run) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell nav={false}>
      <section className="finish-page">
        <div className="confetti" aria-hidden />
        <GlassPanel className="finish-card">
          <span className="success-medal"><Check /></span>
          <h1>DU HAST ES GESCHAFFT!</h1>
          <p>Du hast alle {config.totalSteps} Stufen gemeistert.</p>
          <small>Deine Zeit</small>
          <strong>{formatDuration(run.durationSeconds)}</strong>
          <ValidationBadge status={run.status} />
          <div className="personal-best">
            <Trophy /> <span>Persönliche Bestzeit</span><b>{formatDuration(run.durationSeconds)}</b>
          </div>
        </GlassPanel>
        <Link to={`/result/${run.id}`}><Button icon={<BarChart3 />}>Ergebnis ansehen</Button></Link>
        <Link className="action-row" to="/leaderboard">Rangliste</Link>
      </section>
    </PageShell>
  );
}
