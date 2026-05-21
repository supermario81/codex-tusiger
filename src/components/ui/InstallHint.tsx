import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useApp } from "../../app/AppContext";

const seenKey = "tusiger.installHintDismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isIosSafariUserAgent(userAgent: string, standalone = false): boolean {
  const ua = userAgent.toLowerCase();
  return !standalone && /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function InstallHint() {
  const { language } = useApp();
  const [visible, setVisible] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const copy = language === "en"
    ? {
      title: "Install app",
      body: "Add Tusiger to your home screen for the best PWA experience.",
      action: "Install",
      iosAction: "Show guide",
      safari: "In Safari: open Share and choose “Add to Home Screen”.",
      close: "Close hint",
      modalTitle: "Install Tusiger on iPhone",
      steps: ["Tap the Share icon at the bottom.", "Choose “Add to Home Screen”.", "Tap “Add”."]
    }
    : {
      title: "App installieren",
      body: "Füge Tusiger zum Home-Bildschirm hinzu, damit die PWA wie eine App startet.",
      action: "Installieren",
      iosAction: "Anleitung anzeigen",
      safari: "In Safari: Teilen öffnen und „Zum Home-Bildschirm“ wählen.",
      close: "Hinweis schliessen",
      modalTitle: "Tusiger auf dem iPhone installieren",
      steps: ["Tippe unten auf das Teilen-Symbol.", "Wähle „Zum Home-Bildschirm“.", "Tippe auf „Hinzufügen“."]
    };
  const iosSafari = typeof navigator !== "undefined" && isIosSafariUserAgent(navigator.userAgent, isStandalone());

  useEffect(() => {
    setVisible(!isStandalone() && localStorage.getItem(seenKey) !== "true");
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(seenKey, "true");
    setVisible(false);
  }

  async function install() {
    if (iosSafari || !installPrompt) {
      setShowHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      dismiss();
    } else {
      setShowHelp(true);
    }
  }

  return (
    <div className="install-hint">
      <span><Download /></span>
      <div>
        <p><strong>{copy.title}</strong> {copy.body}</p>
        {showHelp || !installPrompt ? <small>{copy.safari}</small> : null}
        <button className="install-action" type="button" onClick={() => void install()}>{iosSafari ? copy.iosAction : copy.action}</button>
      </div>
      <button type="button" onClick={dismiss} aria-label={copy.close}><X /></button>
      {showHelp ? (
        <div className="install-modal-backdrop" role="dialog" aria-modal="true" aria-label={copy.modalTitle}>
          <div className="install-modal">
            <button type="button" className="install-modal-close" onClick={() => setShowHelp(false)} aria-label={copy.close}><X /></button>
            <h2>{copy.modalTitle}</h2>
            <ol>
              {copy.steps.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </div>
        </div>
      ) : null}
    </div>
  );
}
