# Tusiger

1000 Stufen. Deine Zeit.

Tusiger ist eine mobile-first PWA für die Tausender-Treppe. Nutzer können sich per E-Mail OTP anmelden, ein öffentliches Profil anlegen, einen GPS-basierten Lauf starten, die Zeit zwischen Start- und Zielzone messen, Ergebnisse validieren, persönliche Zeiten vergleichen und Ranglisten, Gruppen sowie Geschichte/Spenden ansehen.

## Lokaler Start

```bash
npm install
npm run dev
```

Vite öffnet die App standardmäßig auf http://localhost:5173.

Ohne Supabase-Konfiguration läuft die App automatisch im sicheren Demo-Modus.

## Scripts

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Supabase konfigurieren

1. Neues Supabase-Projekt erstellen.
2. SQL aus `supabase/migrations/0001_tusiger_schema.sql` ausführen.
3. In Supabase Auth E-Mail OTP aktivieren.
4. Storage-Bucket `avatars` wird durch die Migration angelegt.
5. `.env.example` nach `.env.local` kopieren:

```bash
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
VITE_DEMO_MODE=false
```

Wichtig: Niemals den Supabase Service Role Key im Frontend oder in GitHub committen.

## GitHub Pages Deployment

Der Workflow `.github/workflows/deploy.yml` baut und deployed `dist` nach GitHub Pages.

In GitHub hinterlegen:

- Repository Settings -> Pages -> Source: GitHub Actions
- Secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Optional Variable: `VITE_DEMO_MODE=false`

Für das Repo `codex-tusiger` setzt Vite den Pages-Basispfad automatisch im GitHub-Actions-Build.

## iPhone PWA

Safari öffnen, die GitHub-Pages-URL laden, Teilen-Button drücken und "Zum Home-Bildschirm" wählen.

## PWA basics

Enthalten:

- React + Vite + TypeScript
- PWA Manifest und Service Worker via `vite-plugin-pwa`
- Supabase Auth, DB- und Storage-Vorbereitung
- GPS-basierte Run-Erfassung mit Reload-Schutz
- Offline-Zwischenspeicherung aktiver Läufe
- Validierungslogik mit Tests
- Demo-Modus ohne echte Keys

## iPhone/Safari Hinweise

- GPS funktioniert produktiv nur über HTTPS.
- Device Motion kann eine explizite Nutzerfreigabe brauchen.
- Barometer ist in Safari PWAs normalerweise nicht direkt verfügbar.
- Geolocation-Höhe kann fehlen oder stark rauschen.
- Darum unterstützt die Validierung `needs_review`.
