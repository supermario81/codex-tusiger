import { CSSProperties, useMemo } from "react";

const confettiColors = ["#344E41", "#588157", "#a3b18a", "#c2a747", "#d5bd68", "#e9e5d6"];

// Leichtes DOM/CSS-Konfetti: ~50 transform-animierte Elemente über 3–4,6 s,
// keine Canvas-Bibliothek, kein Layout-Thrashing beim Scrollen.
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
