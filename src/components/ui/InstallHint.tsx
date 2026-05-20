import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

const seenKey = "tusiger.installHintDismissed";

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallHint() {
  const [visible, setVisible] = useState(false);

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
      <p><strong>App installieren</strong> In Safari: Teilen öffnen und „Zum Home-Bildschirm“ wählen.</p>
      <button type="button" onClick={dismiss} aria-label="Hinweis schliessen"><X /></button>
    </div>
  );
}
