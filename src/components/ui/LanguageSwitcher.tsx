import { useApp } from "../../app/AppContext";

export function LanguageSwitcher() {
  const { language, setLanguage } = useApp();

  return (
    <div className="language-switcher" aria-label="Sprache wechseln">
      <button className={language === "de" ? "active" : ""} type="button" onClick={() => setLanguage("de")}>
        DE
      </button>
      <button className={language === "en" ? "active" : ""} type="button" onClick={() => setLanguage("en")}>
        EN
      </button>
    </div>
  );
}
