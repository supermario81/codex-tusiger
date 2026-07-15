import { CSSProperties, PointerEvent, ReactNode, useMemo, useRef, useState } from "react";
import { playRunFanfare, primeRunAudio } from "../../lib/audio/runAudio";

const confettiColors = ["#344E41", "#588157", "#a3b18a", "#c2a747", "#d5bd68", "#e9e5d6"];

// Leichtes DOM/CSS-Konfetti: ~50 transform-animierte Elemente über 3–4,6 s,
// keine Canvas-Bibliothek, kein Layout-Thrashing beim Scrollen.
// Versteckter Test-Trigger: 2 s gedrückt halten spielt Konfetti + Fanfare,
// ohne 1150 Stufen laufen zu müssen. Pointer-Capture + touch-action: none,
// damit iOS Safari den Hold nicht durch Scroll-Erkennung abbricht; der
// Pointer-Down ist die User-Geste, die iOS für den AudioContext braucht.
const celebrationHoldMs = 2000;

export function CelebrationTestTrigger({ children }: { children: ReactNode }) {
  const [burst, setBurst] = useState(0);
  const holdTimer = useRef<number | null>(null);

  function cancelHold() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function startHold(event: PointerEvent<HTMLSpanElement>) {
    try {
      event.currentTarget.setPointerCapture?.(event.pointerId);
    } catch {
      // Capture ist ein Bonus, kein Muss.
    }
    try {
      primeRunAudio();
    } catch {
      // Audio darf den Trigger nie blockieren.
    }
    cancelHold();
    holdTimer.current = window.setTimeout(() => {
      setBurst((count) => count + 1);
      try {
        playRunFanfare();
      } catch {
        // Blockiertes Audio: Konfetti läuft trotzdem.
      }
    }, celebrationHoldMs);
  }

  return (
    <>
      <span
        className="logo-celebration-test"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onContextMenu={(event) => event.preventDefault()}
      >
        {children}
      </span>
      {burst > 0 ? <ConfettiBurst key={burst} fixed /> : null}
    </>
  );
}

export function ConfettiBurst({ fixed = false }: { fixed?: boolean }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 50 }, (_, index) => {
        const size = 6 + Math.random() * 6;
        return {
          left: Math.random() * 100,
          size,
          delay: Math.random() * 0.9,
          duration: 3 + Math.random() * 1.6,
          driftPx: Math.round(-50 + Math.random() * 100),
          rotateDeg: Math.round(200 + Math.random() * 420),
          color: confettiColors[index % confettiColors.length]
        };
      }),
    []
  );

  return (
    <div className={`confetti ${fixed ? "confetti-fixed" : ""}`} aria-hidden>
      {pieces.map((piece, index) => (
        <span
          key={index}
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.size}px`,
              height: `${Math.max(4, piece.size * 0.45)}px`,
              background: piece.color,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              "--confetti-drift": `${piece.driftPx}px`,
              "--confetti-rotate": `${piece.rotateDeg}deg`
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
