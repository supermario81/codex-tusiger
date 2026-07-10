import { execSync } from "node:child_process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const repoName = "codex-tusiger";
const isPages = process.env.GITHUB_ACTIONS === "true";

function gitCommitShort(): string {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

export default defineConfig({
  base: isPages ? `/${repoName}/` : "/",
  define: {
    // Wird beim Build eingebrannt: sichtbare Versionskennung auf Start-Screen
    // und im Profil, damit klar ist, welcher Stand gerade läuft.
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "0.0.0"),
    __APP_COMMIT__: JSON.stringify(gitCommitShort()),
    __APP_BUILD_NUMBER__: JSON.stringify(process.env.GITHUB_RUN_NUMBER ?? "lokal"),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString())
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "Tusiger",
        short_name: "Tusiger",
        description: "1150 Stufen. Deine Zeit.",
        theme_color: "#344E41",
        background_color: "#DAD7CD",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ]
});
