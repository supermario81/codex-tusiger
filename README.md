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

## Supabase Auth Setup

In Supabase unter Authentication -> URL Configuration:

- Site URL: `https://supermario81.github.io/codex-tusiger/`
- Redirect URLs:
  - `https://supermario81.github.io/codex-tusiger/**`
  - `http://localhost:5173/**`
  - `http://localhost:5174/**`

Wenn die Login-Mail auf `localhost:3000` zeigt, ist die Supabase Site URL noch falsch gesetzt.

In Supabase unter Authentication -> Sign In / Providers -> Email:

- Email provider: enabled
- Confirm email: enabled
- Secure email change: enabled
- Double confirm email changes: enabled

Der erste E-Mail-OTP-Login bestätigt die Adresse und erstellt den Auth-User. Es braucht keinen separaten zweiten Double-Opt-in-Schritt.

Supabase nutzt je nach Zustand der Adresse unterschiedliche Templates:

- neue Adresse: `Confirm sign up`
- bestehende Adresse: `Magic link or OTP`

Beide Templates müssen denselben Code-only-Inhalt bekommen, sonst erhältst du einmal einen Link und einmal einen Code.

Code-only-Vorlage für `Confirm sign up` und `Magic link or OTP`:

```html
<h2>Dein Tusiger Login-Code</h2>

<p>Gib diesen Code in der Tusiger App ein. Der Code ist nur kurze Zeit gültig und kann nur einmal verwendet werden.</p>

<p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>

<p>Wenn du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
```

Wichtig: Für Code-Login keinen `{{ .ConfirmationURL }}`-Link in diesen Templates verwenden. One-Time-Links können durch Webmail-Preview, Security-Scanner oder versehentliches Öffnen verbraucht werden.

Mehrsprachige Code-only-Vorlage für beide Templates:

```html
{{ if eq .Data.language "en" }}
  <h2>Your Tusiger sign-in code</h2>
  <p>Enter this code in the Tusiger app. It expires shortly and can only be used once.</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
  <p>If you did not request this sign-in, you can ignore this email.</p>
{{ else }}
  <h2>Dein Tusiger Login-Code</h2>
  <p>Gib diesen Code in der Tusiger App ein. Der Code ist nur kurze Zeit gültig und kann nur einmal verwendet werden.</p>
  <p style="font-size: 32px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
  <p>Wenn du diese Anmeldung nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
{{ end }}
```

Tusiger setzt beim ersten OTP-Versand `user_metadata.language` auf `de` oder `en` und aktualisiert diese Sprache beim Speichern des Profils. Eine vollständig dynamische Sprache pro unregistriertem Loginversuch braucht später einen Supabase Custom Email Hook oder getrennte Auth-Projekte.

## Supabase Migration

Führe zuerst `supabase/migrations/0001_tusiger_schema.sql` im Supabase SQL Editor aus. Danach führe `supabase/migrations/0002_public_grants.sql` aus. Die Migrationen erstellen:

- Profile, Läufe, GPS-Punkte, Gruppen, History, Legal Pages, Analytics und Audit Logs
- RLS Policies
- `avatars` Storage Bucket
- `leaderboard_public` View
- Seed-Daten für Challenge Config, Geschichte und Legal-Entwürfe

Legal-Texte sind ausdrücklich als Entwürfe markiert und müssen juristisch geprüft werden.

## Testdaten Zurücksetzen

Für einen sauberen Auth-Test kann `supabase/reset/clear_test_users.sql` im Supabase SQL Editor ausgeführt werden. Das löscht alle Profile, Läufe, Gruppen, Analytics, Avatar-Dateien und Auth-User. Nur in Test/Staging verwenden.

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
