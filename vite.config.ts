import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const repoName = "codex-tusiger";
const isPages = process.env.GITHUB_ACTIONS === "true";

export default defineConfig({
  base: isPages ? `/${repoName}/` : "/",
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
