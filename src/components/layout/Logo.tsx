import { useApp } from "../../app/AppContext";

export function Logo({ compact = false }: { compact?: boolean }) {
  const { language } = useApp();

  return (
    <div className={`logo ${compact ? "logo-compact" : ""}`} aria-label="Tusiger">
      <svg className="tusiger-mark" viewBox="0 0 96 96" role="img" aria-label="Tusiger Treppenlogo">
        <path d="M18 16h58L62 40h14L47 80H25l15-24H26l14-24H18z" />
        <path d="M51 43h13v8H51zm-8 13h13v8H43zm-8 13h13v8H35z" />
      </svg>
      {!compact ? (
        <>
          <span>TUSIGER</span>
          <em>{language === "en" ? "1150 steps. Your time." : "1150 Stufen. Deine Zeit."}</em>
        </>
      ) : null}
    </div>
  );
}
