# Tusiger

1000 Stufen. Deine Zeit.

Tusiger ist eine mobile-first PWA für die Tausender-Treppe. Nutzer können sich per E-Mail OTP anmelden, ein öffentliches Profil anlegen, einen GPS-basierten Lauf starten, die Zeit zwischen Start- und Zielzone messen, Ergebnisse validieren, persönliche Zeiten vergleichen und Ranglisten, Gruppen sowie Geschichte/Spenden ansehen.

## Lokaler Start

```bash
npm install
npm run dev
```

Vite öffnet die App standardmäßig auf http://localhost:5173.

Ohne Supabase-Konfiguration zeigt die App eine klare Setup-Meldung. Für echte Logins, Läufe, Gruppen und Ranglisten brauchst du den Supabase Anon Key.

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
3. SQL aus `supabase/migrations/0002_public_grants.sql` ausführen.
4. In Supabase Auth E-Mail OTP aktivieren.
5. Storage-Bucket `avatars` wird durch die Migration angelegt.
6. `.env.example` nach `.env.local` kopieren:

```bash
VITE_SUPABASE_URL=https://gmbtkmorvretjwaegkln.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

Wichtig: Niemals den Supabase Service Role Key im Frontend oder in GitHub committen.

## GitHub Pages Deployment

Der Workflow `.github/workflows/deploy.yml` baut und deployed `dist` nach GitHub Pages.

In GitHub hinterlegen:

- Repository Settings -> Pages -> Source: GitHub Actions
- Secrets: `VITE_SUPABASE_ANON_KEY`
- Optional Secret: `VITE_SUPABASE_URL`, falls ein anderes Projekt genutzt wird

Für das Repo `codex-tusiger` setzt Vite den Pages-Basispfad automatisch im GitHub-Actions-Build. Die App verwendet `HashRouter`, damit Reloads und Deep Links auf GitHub Pages funktionieren, z. B. `/#/join/CODE`.

## Supabase Auth URL und E-Mail-Code

In Supabase unter Authentication -> URL Configuration:

- Site URL: `https://supermario81.github.io/codex-tusiger/`
- Redirect URLs:
  - `https://supermario81.github.io/codex-tusiger/**`
  - `http://localhost:5173/**`
  - `http://localhost:5174/**`

Wenn die Login-Mail auf `localhost:3000` zeigt, ist die Supabase Site URL noch falsch gesetzt.

Damit in der Mail ein 6-stelliger Code sichtbar ist, passe unter Authentication -> Email Templates -> Magic Link den Text an und füge `{{ .Token }}` ein. Der Link bleibt zusätzlich über `{{ .ConfirmationURL }}` möglich.

## Supabase Migration

Führe zuerst `supabase/migrations/0001_tusiger_schema.sql` im Supabase SQL Editor aus. Danach führe `supabase/migrations/0002_public_grants.sql` aus. Die Migrationen erstellen:

- Profile, Läufe, GPS-Punkte, Gruppen, History, Legal Pages, Analytics und Audit Logs
- RLS Policies
- `avatars` Storage Bucket
- `leaderboard_public` View
- Seed-Daten für Challenge Config, Geschichte und Legal-Entwürfe

Legal-Texte sind ausdrücklich als Entwürfe markiert und müssen juristisch geprüft werden.

## Donation / TWINT Assets

Die App erstellt keine Zahlungen und empfängt keine Spenden. Die Spende geht direkt an die zuständige freiwillige Arbeitsgruppe / Born Rangers Team.

Lege die offiziellen Flyer-Dateien in `public/images/` ab:

```text
public/images/twint-1000er-staegli.jpg
public/images/flyer-1000er-staegli.jpg
```

Kein QR-Code wird künstlich generiert.

## iPhone PWA

Safari öffnen, die GitHub-Pages-URL laden, Teilen-Button drücken und "Zum Home-Bildschirm" wählen.

## PWA basics

Enthalten:

- React + Vite + TypeScript
- PWA Manifest und Service Worker via `vite-plugin-pwa`
- Supabase Auth, DB- und Storage-Integration
- GPS-basierte Run-Erfassung mit Reload-Schutz
- Offline-Zwischenspeicherung aktiver Läufe
- Validierungslogik mit Tests
- first-party Analytics Events in Supabase

## iPhone/Safari Hinweise

- GPS funktioniert produktiv nur über HTTPS.
- Device Motion kann eine explizite Nutzerfreigabe brauchen.
- Barometer ist in Safari PWAs normalerweise nicht direkt verfügbar.
- Geolocation-Höhe kann fehlen oder stark rauschen.
- Darum unterstützt die Validierung `needs_review`.
