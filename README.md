# Homelab Dashboard

![Homelab Dashboard](screen.png)

Self-hosted dashboard for homelab services: tiles with health checks, live API hover widgets, multiple pages, Web/LAN switching, and full browser-based configuration — no YAML or config files required.

**Deutsche Version:** [README_de.md](README_de.md)

## Highlights

- **Dashboard** — category columns, live search, health status, glass design with theme presets
- **Multiple pages** — tabs with keyboard shortcuts `1`–`9`, categories per page
- **Web / LAN** — external and local URL per service; toggle in the header (can be disabled)
- **Hover widgets** — live data from 35+ services (Plex, Nextcloud, Proxmox, …)
- **Layout with Shift** — logged-in users reorder categories and tiles via drag & drop
- **Service rows** — up to three services side by side per row (admin and dashboard)
- **Admin** — services, categories, pages, header/footer links, themes, backup
- **Internationalization** — English and German UI; language switcher in Admin → Settings
- **Optional dashboard sign-in** — require login before viewing the dashboard (Admin → Settings)
- **Docker-ready** — SQLite volume, migrations on container start, pre-built images on GHCR

## Quick start

### Requirements

Node.js 20+ & npm  
or  
Docker

### Local (development)

```bash
cp .env.example .env
# Set ADMIN_PASSWORD and SESSION_SECRET in .env

npm install
npm run db:migrate
npm run dev
```

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Dashboard |
| http://localhost:3000/admin | Admin (login with `ADMIN_PASSWORD`) |

### Docker

#### Pre-built image (recommended)

No local build required — pull from GitHub Container Registry.

```bash
mkdir homelab-dashboard && cd homelab-dashboard
```

Create `docker-compose.yml`:

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

Create `.env` (adjust values before starting):

```env
ADMIN_PASSWORD=change-me
SESSION_SECRET=change-me-to-a-random-string-at-least-32-characters
PORT=3333
# Behind a reverse proxy (HTTPS):
# APP_URL=https://dashboard.example.com
# COOKIE_SECURE=true
```

```bash
docker compose pull
docker compose up -d
```

Dashboard: **http://localhost:3333** (or the `PORT` set in `.env`)

**Docker CLI only** (without Compose):

```bash
mkdir homelab-dashboard && cd homelab-dashboard
```

Create `.env` as above, then:

```bash
docker pull ghcr.io/maxdeavy/dashboard:1.0.1
docker run -d \
  --name homelab-dashboard \
  --restart unless-stopped \
  -p 3333:3333 \
  --env-file .env \
  -v "$(pwd)/data:/app/data" \
  ghcr.io/maxdeavy/dashboard:1.0.1
```

Available versions: [GitHub Releases](https://github.com/MaxDeavy/dashboard/releases)  
Image tag matches the release version (`v1.0.1` → `ghcr.io/maxdeavy/dashboard:1.0.1`). The `latest` tag always points to the most recent release.

#### Build from source (development)

```bash
cp .env.example .env
# Set PORT=3333 and production secrets

docker compose up -d --build
```

The SQLite database lives in the `./data` volume. Migrations run automatically on container start.

---

## Configuration

All settings are managed in the admin at `/admin`. The last opened tab is remembered in the browser.

### Services

| Feature | Description |
|---------|-------------|
| **Web URL / LAN URL** | External address and optional local IP/hostname |
| **Active / inactive** | Disabled services are hidden |
| **Icons** | Presets from `assets/`, custom URL, or upload |
| **Tile color** | Individual accent color |
| **Health check** | Optional separate URL; per-service TLS exception |
| **Hover widget** | API integration with encrypted credentials |
| **Link target** | Same tab or new tab |
| **Row layout** | Arrange up to three services side by side per row |

Unsaved changes in service or category dialogs trigger a confirmation before closing.

#### Arrange services in rows

In Admin under **Services**, the default view is still **one full-width row per service**. Via drag & drop you can also place services **side by side** or **between** existing tiles — up to three per row. The layout is saved automatically and reflected on the dashboard.

| Action | How |
|--------|-----|
| **Own row** | Drag onto the **line above** a row |
| **Beside another** | Drag onto the **vertical line** to the right of a tile |
| **Between two** | Drag onto the **vertical line between** two tiles |
| **New row at bottom** | Drag below the last row in the category |

Single services keep full width — only deliberately grouped tiles sit side by side.

#### Display on the dashboard

| Layout | Appearance |
|--------|------------|
| **1 per row** | Standard tile: icon left, name and subtitle |
| **2 per row** | Compact tiles with spacing, uniform row height |
| **3 per row** | Icon on top, subtitle below (no service name), uniform row height |

Logged-in admins can also adjust layout on the dashboard with **Shift + drag & drop** (horizontal and vertical insertion lines, same as in admin).

The selected services page in the admin is remembered in the browser.

### Pages

Multiple dashboard pages with their own categories. Switch in the dashboard via the tab bar or keys `1`–`9`.

### Design (Settings)

- Theme presets (Stealth, Ember, Neon, Cobalt) or custom colors
- Dark / light mode
- Background image, **background color**, and logo
- Layout sliders: icon size, tile shape, font, column spacing, max width
- **Language** — English or German (stored in a cookie, applies to dashboard and admin)

### Web / LAN

| Mode | Behavior |
|------|----------|
| **Web** | Always uses the Web URL |
| **LAN** | Uses `lanUrl` when set; otherwise dimmed tile with hint |

The selection persists after reload (`localStorage`). The Web/LAN toggle can be hidden in **Admin → Settings** if you do not need LAN URLs.

### Edit layout (dashboard)

1. Hold **Shift**
2. Drag categories (⋮⋮ handle) and tiles to reorder
3. Release **Shift** — normal navigation resumes

While dragging tiles, **insertion lines** appear: horizontal between rows, vertical between or beside tiles in a row. Only for logged-in admins; disabled while a search is active.

### Backup

In Admin under **Settings**: export or import a ZIP backup (database and uploads, including encrypted widget credentials).

---

## Widget configuration

In Admin: **Services** → edit service → **Links & widget**

| Widget | Credentials | Shows e.g. |
|--------|---------------|------------|
| **Sonarr / Radarr / Lidarr / Bazarr** | API key | Queue, size, missing |
| **Prowlarr** | API key | Indexers, queue |
| **qBittorrent / Transmission / Deluge** | User + password | Speed, active torrents |
| **SABnzbd** | API key | Speed, queue |
| **Proxmox** | API token + node | CPU, RAM, disk, VMs/LXC, uptime |
| **Docker Engine** | — | Containers, images |
| **Portainer** | API token | Containers per endpoint |
| **Nginx Proxy Manager** | Email + password | Online hosts, SSL certs, redirects |
| **Pi-hole / AdGuard Home** | App password / API key | Queries, block rate |
| **Technitium DNS** | API token | Queries, blocklists |
| **Jellyseerr / Overseerr** | API key | Open requests |
| **Jellyfin / Plex / Tautulli** | API key / token | Active streams, library, sessions / stats |
| **Nextcloud** | NC token | Storage, users, apps |
| **Immich** | API key | Library statistics |
| **Mealie** | API token | Recipes |
| **Kavita / Audiobookshelf** | Auth key / API token | Libraries, series, storage / media |
| **Navidrome** | User + password | Artists, albums, now playing |
| **Paperless-ngx** | API token | Documents, inbox |
| **n8n / Grafana** | API key | Workflows / dashboards |
| **Home Assistant** | Access token | Entities, automations, or entity state |
| **QNAP** | User + password | CPU, RAM, volume, temperature |
| **FileBrowser** | User + password | Storage usage |
| **Guacamole** | User + password | Connections |
| **FRITZ!Box** | — | Connection, speeds, external IP, traffic (TR-064) |
| **Iframe / Embed** | — | External page in hover panel |
| **Generic** | — | HTTP status, latency |

API credentials are stored AES-256-GCM encrypted in SQLite.

### Docker widget

Talks to the Docker Engine API. `docker-compose.yml` includes an optional socket mount; [docker-socket-proxy](https://github.com/Tecnativa/docker-socket-proxy) is safer:

1. Enable the proxy in `docker-compose.yml` (commented template)
2. Widget type **Docker Engine**, API URL `http://docker-socket-proxy:2375`

### QNAP

- User with system monitoring permissions
- Disable 2FA for the API user
- API URL e.g. `https://nas.local:8080` (QNAP web port)
- Optional: volume name for a single volume

---

## Environment variables

Copy `.env.example` to `.env`. Only a few values are required for a typical deployment.

### Required (production)

| Variable | Description |
|----------|-------------|
| `ADMIN_PASSWORD` | Admin login (plain text or bcrypt hash via `npm run hash-password`) |
| `SESSION_SECRET` | Session encryption (min. 32 characters) |

### Common

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP port | `3000` (Docker: `3333`) |
| `APP_URL` | Public URL for redirects behind a reverse proxy | from request headers |
| `COOKIE_SECURE` | Send session cookie only over HTTPS | `false` |

`HOSTNAME` (bind address inside the container) defaults to `0.0.0.0` in the Docker image — you do not need to set it in `.env`. In Compose, `environment:` overrides `.env` for the same key anyway.

`APP_URL` is **not** the same as `HOSTNAME`: the app listens on `0.0.0.0:PORT` inside Docker, while `APP_URL` is the address users type in the browser (e.g. `https://dashboard.example.com`). Set `APP_URL` only when redirects after login go to the wrong host (typical behind nginx, Traefik, etc.).

### Optional (defaults are fine)

| Variable | Default |
|----------|---------|
| `CREDENTIALS_ENCRYPTION_SECRET` | = `SESSION_SECRET` |
| `CREDENTIALS_ENCRYPTION_SALT` | `homelab-dashboard-salt` |
| `SESSION_COOKIE_NAME` | `homelab-dashboard-session` |
| `SESSION_MAX_AGE_DAYS` | `7` |
| `DATABASE_URL` | `file:./data/dashboard.db` |
| `APP_STORAGE_PREFIX` / `NEXT_PUBLIC_APP_STORAGE_PREFIX` | `homelab-dashboard` |
| `MAX_BACKGROUND_UPLOAD_MB` | `5` |
| `MAX_LOGO_UPLOAD_MB` | `1` |
| `MAX_ICON_UPLOAD_MB` | `1` |

Cookie name and storage prefix only matter if you run multiple instances on the same browser origin or need to migrate sessions — not for a normal single install.

In **production**, `ADMIN_PASSWORD` and `SESSION_SECRET` must be set.

For a bcrypt hash instead of plain text:

```bash
npm run hash-password -- "your-strong-password"
```

Put the output into `ADMIN_PASSWORD` in `.env`.

Migrations run automatically when the server starts (`instrumentation.ts`). `npm run db:migrate` is optional for manual runs.

See [SECURITY.md](SECURITY.md) for deployment guidance.

Self-signed TLS certificates: enable per service in Admin under *Health check*.

---

## Icons

Bundled icons live in `assets/` and are copied to `public/assets/` on build (`npm run assets:sync`).

---

## Tech stack

- **Next.js 16** (App Router), **React 19**, **Tailwind CSS 4**
- **next-intl** for internationalization
- **SQLite** with Drizzle ORM
- **iron-session** for admin auth
- **Docker** with multi-stage build

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run db:migrate` | Run database migrations manually |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run hash-password` | Generate bcrypt hash for `ADMIN_PASSWORD` |
| `npm run lint` | ESLint |

---

## Security

- Set strong values for `ADMIN_PASSWORD` and `SESSION_SECRET` in production.
- Prefer a bcrypt hash for `ADMIN_PASSWORD` (`npm run hash-password`).
- Set `COOKIE_SECURE=true` behind HTTPS.
- Login attempts are rate-limited per IP.
- Widget credentials are encrypted in the DB; still grant only minimal API permissions.
- Mounting the Docker socket directly is convenient but risky — use a socket proxy.

Details: [SECURITY.md](SECURITY.md)

---

## License

[MIT](LICENSE)
