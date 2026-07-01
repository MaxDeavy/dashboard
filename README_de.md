# Homelab Dashboard

![Homelab Dashboard](screen.png)

Selbst gehostetes Dashboard für Homelab-Dienste — alles im Browser konfigurieren, ohne YAML. Kacheln mit Health-Checks, Live-API-Daten per Hover und ein Layout, das du an dein Setup anpassen kannst.

**English version:** [README.md](README.md)

## Features

### Dashboard auf einen Blick

Dienste als Kacheln in Kategorie-Spalten mit Glass-UI. Jede Kachel kann einen **Health-Status** über eine separate Check-URL anzeigen.

**Theme-Presets** (Stealth, Ember, Neon, Cobalt) oder eigene Farben, Dark/Light Mode, Hintergrundbild und -farbe, Logo-Upload — Kachel-, Fenster- und Seitenbreite anpassbar.

### Live-API-Hover-Widgets (46+ Dienste)

Über eine Kachel hovern für **Echtzeitdaten** aus der API: Plex, Proxmox, Pi-hole, qBittorrent, Home Assistant, FRITZ!Box und mehr. Zugangsdaten werden **AES-256-GCM-verschlüsselt** in SQLite gespeichert.

**Shift** gedrückt halten und Feldlabels anklicken, um einzelne Widget-Zeilen ein- oder auszublenden — pro Dienst, in der Datenbank gespeichert (nur angemeldete Admins). *Gerade läuft* / *Watching Now* erscheinen nur bei aktiver Wiedergabe.

Unterstützt u. a. Jellyfin, Plex, Nextcloud, Immich, *arr-Stack, Docker/Portainer, NPM, Proxmox, QNAP, Navidrome, Kavita, n8n, Grafana, Uptime Kuma, Vaultwarden, Gitea, Syncthing, Authentik, FreshRSS, BookStack, Frigate, Autobrr, Romm, Trilium — siehe [Widget-Tabelle](#widget-konfiguration) weiter unten.

### Layout & Seiten

- **Mehrere Dashboard-Seiten** mit Tabs und Tastaturkürzeln `1`–`9`
- **Drag & Drop** für Kategorien und Kacheln (**Shift** auf dem Dashboard, wenn angemeldet)
- Bis zu **drei Dienste pro Zeile** — im Admin oder auf dem Dashboard
- **Web / LAN**-Umschaltung pro Dienst: externe URL vs. lokale IP/Hostname im Header (deaktivierbar)

**Backup & Restore** als ZIP (Datenbank + Uploads + verschlüsselte Widget-Zugangsdaten). Optionale **Dashboard-Anmeldung**, damit nur angemeldete Nutzer das Board sehen.

Bug oder fehlendes API-Feld für dein Setup? Bitte ein [Issue](https://github.com/MaxDeavy/dashboard/issues) öffnen — ich nutze selbst nur etwa die Hälfte der Widgets.

## Schnellstart

### Voraussetzungen

Node.js 20+ & npm  
oder  
Docker

### Lokal (Entwicklung)

```bash
cp .env.example .env
# ADMIN_PASSWORD und SESSION_SECRET in .env setzen

npm install
npm run db:migrate
npm run dev
```

| URL | Beschreibung |
|-----|--------------|
| http://localhost:3000 | Dashboard |
| http://localhost:3000/admin | Admin (Login mit `ADMIN_PASSWORD`) |

### Docker

#### Vorgefertigtes Image (empfohlen)

Kein lokaler Build nötig — Image von GitHub Container Registry.

```bash
mkdir homelab-dashboard && cd homelab-dashboard
```

`docker-compose.yml` anlegen:

```yaml
services:
  dashboard:
    container_name: homelab-dashboard
    image: ghcr.io/maxdeavy/dashboard:latest
    restart: unless-stopped
    ports:
      - "${PORT:-3333}:${PORT:-3333}"
    env_file:
      - .env
    environment:
      PORT: ${PORT:-3333}
    volumes:
      - ./data:/app/data
```

`.env` anlegen (Werte vor dem Start anpassen):

```env
ADMIN_PASSWORD=change-me
SESSION_SECRET=change-me-to-a-random-string-at-least-32-characters
PORT=3333
# Hinter Reverse Proxy (HTTPS):
# APP_URL=https://dashboard.example.com
# COOKIE_SECURE=true
```

```bash
docker compose pull
docker compose up -d
```

Dashboard: **http://localhost:3333** (oder der in `.env` gesetzte `PORT`)

**Nur Docker CLI** (ohne Compose):

```bash
mkdir homelab-dashboard && cd homelab-dashboard
```

`.env` wie oben anlegen, dann:

```bash
docker pull ghcr.io/maxdeavy/dashboard:1.0.4
docker run -d \
  --name homelab-dashboard \
  --restart unless-stopped \
  -p 3333:3333 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/maxdeavy/dashboard:1.0.4
```

Verfügbare Versionen: [GitHub Releases](https://github.com/MaxDeavy/dashboard/releases)  
Image-Tag entspricht der Versionsnummer (`v1.0.4` → `ghcr.io/maxdeavy/dashboard:1.0.4`). Der Tag `latest` zeigt immer auf das neueste Release.

#### Aus Quellcode bauen (Entwicklung)

```bash
cp .env.example .env
# PORT=3333 und Production-Secrets setzen

docker compose up -d --build
```

Die SQLite-Datenbank liegt im Volume `./data`. Migrationen laufen beim Container-Start automatisch.

---

## Konfiguration

Alle Einstellungen erfolgen im Admin unter `/admin`. Der zuletzt geöffnete Tab wird im Browser gemerkt.

### Dienste

| Funktion | Beschreibung |
|----------|--------------|
| **Web-URL / LAN-URL** | Externe Adresse und optionale lokale IP/Hostname |
| **Aktiv / Inaktiv** | Deaktivierte Dienste werden ausgeblendet |
| **Icons** | Vorlagen aus `assets/`, eigene URL oder Upload |
| **Kachelfarbe** | Individuelle Akzentfarbe |
| **Health-Check** | Optional abweichende URL; TLS-Ausnahme pro Dienst |
| **Hover-Widget** | API-Anbindung mit verschlüsselten Zugangsdaten |
| **Link-Ziel** | Gleicher Tab oder neuer Tab |
| **Zeilen-Layout** | Bis zu drei Dienste pro Zeile nebeneinander anordnen |

Ungespeicherte Änderungen in Dienst- oder Kategorie-Dialogen lösen vor dem Schließen eine Bestätigung aus.

#### Dienste in Zeilen anordnen

Im Admin unter **Dienste** bleibt die Standardansicht eine **volle Zeile pro Dienst**. Per Drag & Drop lassen sich Dienste zusätzlich **nebeneinander** oder **dazwischen** platzieren — bis zu drei pro Zeile. Das Layout wird automatisch gespeichert und im Dashboard übernommen.

| Aktion | So geht's |
|--------|-----------|
| **Eigene Zeile** | Dienst auf die **Linie oberhalb** einer Zeile ziehen |
| **Rechts daneben** | Dienst in die **vertikale Linie** rechts neben einer Kachel ziehen |
| **Dazwischen** | Dienst in die **vertikale Linie zwischen** zwei Kacheln ziehen |
| **Neue Zeile unten** | Dienst unter die letzte Zeile der Kategorie ziehen |

Einzelne Dienste nutzen weiterhin die volle Breite — nur bewusst gruppierte Kacheln stehen nebeneinander.

#### Darstellung im Dashboard

| Anordnung | Darstellung |
|-----------|-------------|
| **1 pro Zeile** | Normale Kachel: Icon links, Name und Untertitel |
| **2 pro Zeile** | Kompakte Kacheln mit etwas Abstand, gleiche Zeilenhöhe |
| **3 pro Zeile** | Icon oben, Untertitel darunter (ohne Dienstname), gleiche Zeilenhöhe |

Im Dashboard können angemeldete Admins das Layout zusätzlich mit **Shift + Drag & Drop** anpassen (horizontale und vertikale Einfüge-Linien wie im Admin).

Die gewählte Dienste-Seite im Admin wird im Browser gemerkt.

### Seiten

Mehrere Dashboard-Seiten mit eigenen Kategorien. Im Dashboard wechseln per Tab-Leiste oder Tasten `1`–`9`.

### Design (Einstellungen)

- Theme-Presets (Stealth, Ember, Neon, Cobalt) oder eigene Farben
- Dark / Light Mode
- Hintergrundbild, **Hintergrundfarbe** und Logo
- Layout-Slider: Icon-Größe, Kachelform, Schrift, Spaltenabstand, maximale Breite
- **Sprache** — Englisch oder Deutsch (Cookie, gilt für Dashboard und Admin)

### Web / LAN

| Modus | Verhalten |
|-------|-----------|
| **Web** | Nutzt immer die Web-URL |
| **LAN** | Nutzt `lanUrl`, falls gesetzt; sonst abgedunkelte Kachel mit Hinweis |

Die Auswahl bleibt nach Reload erhalten (`localStorage`). Den Web/LAN-Umschalter kannst du unter **Admin → Einstellungen** ausblenden, wenn du keine LAN-URLs brauchst.

### Widget-Felder anpassen

Mit geöffnetem Widget-Panel **Shift** gedrückt halten und auf ein Feldlabel klicken, um es ein- oder auszublenden. Die Auswahl wird pro Dienst in der **Datenbank** gespeichert und gilt auf allen Geräten gleich (nur angemeldete Admins). Im Shift-Modus erscheinen ausgeblendete Felder durchgestrichen, damit du sie wieder aktivieren kannst.

### Layout bearbeiten (Dashboard)

1. **Shift** gedrückt halten
2. Kategorien (⋮⋮-Griff) und Kacheln per Drag & Drop anordnen
3. **Shift** loslassen — normale Navigation

Beim Verschieben von Kacheln erscheinen **Einfüge-Linien**: horizontal zwischen Zeilen, vertikal zwischen oder neben Kacheln in einer Zeile. Nur für angemeldete Admins; während einer aktiven Suche deaktiviert.

### Backup

Im Admin unter **Einstellungen**: Konfiguration als ZIP exportieren oder importieren (Datenbank und Uploads, inkl. verschlüsselter Widget-Zugangsdaten).

---

## Widget-Konfiguration

Im Admin: **Dienste** → Dienst bearbeiten → **Links & Widget**

| Widget | Zugangsdaten | Zeigt u. a. |
|--------|--------------|-------------|
| **Sonarr / Radarr / Lidarr / Bazarr** | API-Key | Queue, Größe, Fehlend |
| **Prowlarr** | API-Key | Indexer, Queue |
| **qBittorrent / Transmission / Deluge** | Benutzer + Passwort | Speed, aktive Torrents |
| **SABnzbd** | API-Key | Speed, Queue |
| **Proxmox** | API-Token + Node | CPU, RAM, Festplatte, VMs/LXC, Uptime |
| **Docker Engine** | — | Container, Images |
| **Portainer** | API-Token | Container pro Endpoint |
| **Nginx Proxy Manager** | E-Mail + Passwort | Online-Hosts, SSL-Zertifikate, Weiterleitungen |
| **Pi-hole / AdGuard Home** | App-Passwort / API-Key | Anfragen, Block-Rate |
| **Technitium DNS** | API-Token | Abfragen, Blocklisten |
| **Jellyseerr / Overseerr** | API-Key | Offene Anfragen |
| **Jellyfin / Plex / Tautulli** | API-Key / Token | Aktive Streams, Bibliothek, Sessions / Statistik |
| **Nextcloud** | NC-Token | Speicher, Benutzer, Apps |
| **Immich** | API-Key | Bibliotheksstatistik |
| **Mealie** | API-Token | Rezepte |
| **Kavita / Audiobookshelf** | Auth-Key / API-Token | Bibliotheken, Serien, Speicher / Medien |
| **Navidrome** | Benutzer + Passwort | Künstler, Alben, gerade läuft |
| **Paperless-ngx** | API-Token | Dokumente, Posteingang |
| **Trilium Notes** | ETAPI-Token | Notizen, Anhänge, Speicher |
| **Uptime Kuma** | API-Key / Status-Page | Monitore online/offline, Antwortzeit |
| **Vaultwarden** | Admin-Token | Benutzer, Organisationen |
| **Gitea** | Access Token | Repos, Issues, Pull Requests |
| **Syncthing** | API-Key | Geräte, Ordner, Sync-Traffic |
| **Authentik** | API-Token | Benutzer, Apps, Provider |
| **FreshRSS** | E-Mail + API-Passwort | Ungelesen, Feeds, Kategorien |
| **BookStack** | API-Token | Regale, Bücher, Seiten |
| **Frigate** | Benutzer + Passwort | Kameras, Detektion, Events |
| **Autobrr** | API-Key | Releases, Filter, Indexer |
| **Romm** | Benutzer + Passwort | Plattformen, ROMs, Speicher |
| **n8n / Grafana** | API-Key | Workflows / Dashboards |
| **Home Assistant** | Access-Token | Entitäten, Automationen oder Entity-State |
| **QNAP** | Benutzer + Passwort | CPU, RAM, Volume, Temperatur |
| **FileBrowser** | Benutzer + Passwort | Speicherauslastung, Freigaben, Version |
| **Guacamole** | Benutzer + Passwort | Verbindungen |
| **FRITZ!Box** | — | Verbindung, Speeds, externe IP, Traffic (TR-064) |
| **Iframe / Embed** | — | Externe Seite im Hover-Panel |
| **Generic** | — | HTTP-Status, Latenz |

API-Zugangsdaten werden AES-256-GCM-verschlüsselt in SQLite gespeichert.

### Docker-Widget

Spricht die Docker Engine API an. Im `docker-compose.yml` ist optional ein Socket-Mount vorgesehen; sicherer ist [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy):

1. Proxy in `docker-compose.yml` aktivieren (auskommentierte Vorlage)
2. Widget-Typ **Docker Engine**, API-URL `http://docker-socket-proxy:2375`

### QNAP

- Benutzer mit Rechten für Systemüberwachung
- 2FA für den API-Benutzer deaktivieren
- API-URL z. B. `https://nas.local:8080` (QNAP-Webport)
- Optional: Volume-Name für ein einzelnes Volume

---

## Umgebungsvariablen

`.env.example` nach `.env` kopieren. Für eine normale Installation reichen wenige Werte.

### Pflicht (Production)

| Variable | Beschreibung |
|----------|--------------|
| `ADMIN_PASSWORD` | Admin-Login (Klartext oder bcrypt-Hash via `npm run hash-password`) |
| `SESSION_SECRET` | Session-Verschlüsselung (min. 32 Zeichen) |

### Üblich

| Variable | Beschreibung | Standard |
|----------|--------------|----------|
| `PORT` | HTTP-Port | `3000` (Docker: `3333`) |
| `APP_URL` | Öffentliche URL für Redirects hinter Reverse Proxy | aus Request-Headern |
| `COOKIE_SECURE` | Session-Cookie nur über HTTPS | `false` |

`HOSTNAME` (Bind-Adresse im Container) ist im Docker-Image bereits `0.0.0.0` — muss nicht in `.env` stehen. In Compose überschreibt `environment:` ohnehin Werte aus `.env`.

`APP_URL` ist **nicht** dasselbe wie `HOSTNAME`: Die App lauscht im Container auf `0.0.0.0:PORT`, `APP_URL` ist die Adresse im Browser (z. B. `https://dashboard.example.com`). Nur setzen, wenn Redirects nach dem Login auf die falsche Adresse gehen (typisch hinter nginx, Traefik, …).

### Optional (Standardwerte reichen)

| Variable | Standard |
|----------|----------|
| `CREDENTIALS_ENCRYPTION_SECRET` | = `SESSION_SECRET` |
| `CREDENTIALS_ENCRYPTION_SALT` | `homelab-dashboard-salt` |
| `SESSION_COOKIE_NAME` | `homelab-dashboard-session` |
| `SESSION_MAX_AGE_DAYS` | `7` |
| `DATABASE_URL` | `file:./data/dashboard.db` |
| `APP_STORAGE_PREFIX` / `NEXT_PUBLIC_APP_STORAGE_PREFIX` | `homelab-dashboard` |
| `MAX_BACKGROUND_UPLOAD_MB` | `5` |
| `MAX_LOGO_UPLOAD_MB` | `1` |
| `MAX_ICON_UPLOAD_MB` | `1` |

Cookie-Name und Storage-Präfix sind nur relevant bei mehreren Instanzen auf derselben Browser-Origin oder Session-Migration — nicht für eine normale Einzelinstallation.

In **Production** müssen `ADMIN_PASSWORD` und `SESSION_SECRET` gesetzt sein.

Bcrypt-Hash statt Klartext:

```bash
npm run hash-password -- "dein-starkes-passwort"
```

Ausgabe als `ADMIN_PASSWORD` in `.env` eintragen.

Migrationen laufen beim Serverstart automatisch (`instrumentation.ts`). `npm run db:migrate` ist optional für manuelle Läufe.

Siehe [SECURITY.md](SECURITY.md) für Deployment-Hinweise.

Selbstsignierte TLS-Zertifikate: pro Dienst im Admin unter *Health-Check* aktivieren.

---

## Icons

Mitgelieferte Icons liegen in `assets/` und werden beim Build nach `public/assets/` kopiert (`npm run assets:sync`).

---

## Technik

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**
- **next-intl** für Mehrsprachigkeit
- **SQLite** mit Drizzle ORM
- **iron-session** für Admin-Auth
- **Docker** mit Multi-Stage-Build

### Skripte

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Production-Build |
| `npm run start` | Production-Server |
| `npm run db:migrate` | Datenbank-Migrationen manuell ausführen |
| `npm run db:generate` | Drizzle-Migration erzeugen |
| `npm run hash-password` | bcrypt-Hash für `ADMIN_PASSWORD` erzeugen |
| `npm run lint` | ESLint |

---

## Sicherheit

- Setze starke Werte für `ADMIN_PASSWORD` und `SESSION_SECRET` in Production.
- Bevorzuge einen bcrypt-Hash für `ADMIN_PASSWORD` (`npm run hash-password`).
- Setze `COOKIE_SECURE=true` hinter HTTPS.
- Login-Versuche werden pro IP rate-limitiert.
- Widget-Zugangsdaten liegen verschlüsselt in der DB; trotzdem nur minimal nötige API-Rechte vergeben.
- Docker-Socket direkt zu mounten ist bequem, aber riskant — nutze einen Socket-Proxy.

Details: [SECURITY.md](SECURITY.md)

---

## Feedback & Issues

Bugs, fehlende Widget-Daten oder Feature-Ideen — bitte ein [Issue](https://github.com/MaxDeavy/dashboard/issues) öffnen (Dienst, Widget-Typ, erwartetes vs. tatsächliches Verhalten). Siehe auch den Hinweis unter [Features](#features).

---

## Lizenz

[MIT](LICENSE)
