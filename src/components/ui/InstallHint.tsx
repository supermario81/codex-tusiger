import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../app/AppContext";

const seenKey = "tusiger.installHintDismissed";

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallHint() {
  const { language } = useApp();
  const [visible, setVisible] = useState(false);
  const copy = language === "en"
    ? {
      title: "Install app",
      body: "In Safari: open Share and choose “Add to Home Screen”.",
      close: "Close hint"
    }
    : {
      title: "App installieren",
      body: "In Safari: Teilen öffnen und „Zum Home-Bildschirm“ wählen.",
      close: "Hinweis schliessen"
    };

  useEffect(() => {
    setVisible(!isStandalone() && localStorage.getItem(seenKey) !== "true");
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(seenKey, "true");
    setVisible(false);
  }

  return (
    <div className="install-hint">
      <span><Download /></span>
      <p><strong>{copy.title}</strong> {copy.body}</p>
      <button type="button" onClick={dismiss} aria-label={copy.close}><X /></button>
    </div>
  );
}
