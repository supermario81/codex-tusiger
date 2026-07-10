// Zentrale Versionsinfo: beim Build eingebrannt (siehe vite.config.ts).
// Fallbacks greifen nur in Umgebungen ohne Vite-define (z. B. Vitest).
function defined(value: () => string, fallback: string): string {
  try {
    return value();
  } catch {
    return fallback;
  }
}

export const appVersion = {
  version: defined(() => __APP_VERSION__, "0.0.0"),
  commit: defined(() => __APP_COMMIT__, "dev"),
  buildNumber: defined(() => __APP_BUILD_NUMBER__, "lokal"),
  builtAt: defined(() => __APP_BUILT_AT__, "")
};

export function formatAppVersionLine(language: "de" | "en"): string {
  const deployedAt = appVersion.builtAt
    ? new Date(appVersion.builtAt).toLocaleString(language === "en" ? "en-GB" : "de-CH", {
        dateStyle: "medium",
        timeStyle: "short"
      })
    : "";
  const build = appVersion.buildNumber === "lokal" ? appVersion.buildNumber : `#${appVersion.buildNumber}`;
  const deployedLabel = language === "en" ? "deployed" : "deployt";
  return `v${appVersion.version} · Build ${build} · ${appVersion.commit}${deployedAt ? ` · ${deployedLabel} ${deployedAt}` : ""}`;
}
