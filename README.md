# Homelab Dashboard

![Homelab Dashboard](screen.png)

Self-hosted dashboard for homelab services: tiles with health checks, live API hover widgets, multiple pages, Web/LAN switching, and full browser-based configuration — no YAML or config files required.

**Deutsche Version:** [README_de.md](README_de.md)

## Highlights

- **Dashboard** — category columns, live search, health status, glass design with theme presets
- **Multiple pages** — tabs with keyboard shortcuts `1`–`9`, categories per page
- **Web / LAN** — external and local URL per service; toggle in the header
- **Hover widgets** — live data from 35+ services (Plex, Nextcloud, Proxmox, …)
- **Layout with Ctrl** — logged-in users reorder categories and tiles via drag & drop
- **Service rows** — up to three services side by side per row (admin and dashboard)
- **Admin** — services, categories, pages, header/footer links, themes, backup
- **Internationalization** — English and German UI; language switcher in Admin → Settings
- **Docker-ready** — SQLite volume, migrations on container start

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

```bash
cp .env.example .env
# Set PORT=3333 and production secrets

docker compose up -d --build
```

Dashboard: **http://localhost:3333** (or the `PORT` set in `.env`)

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

Logged-in admins can also adjust layout on the dashboard with **Ctrl + drag & drop** (horizontal and vertical insertion lines, same as in admin).

The selected services page in the admin is remembered in the browser.

### Pages

Multiple dashboard pages with their own categories. Switch in the dashboard via the tab bar or keys `1`–`9`.

### Design (Settings)

- Theme presets (Stealth, Ember, Neon, Cobalt) or custom colors
- Dark / light mode
- Background image and logo
- Layout sliders: icon size, tile shape, font, column spacing, max width
- **Language** — English or German (stored in a cookie, applies to dashboard and admin)

### Web / LAN

| Mode | Behavior |
|------|----------|
| **Web** | Always uses the Web URL |
| **LAN** | Uses `lanUrl` when set; otherwise dimmed tile with hint |

The selection persists after reload (`localStorage`).

### Edit layout (dashboard)

1. Hold **Ctrl**
2. Drag categories (⋮⋮ handle) and tiles to reorder
3. Release **Ctrl** — normal navigation resumes

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
| **Proxmox** | API token + node | CPU, RAM, uptime |
| **Docker Engine** | — | Containers, images |
| **Portainer** | API token | Containers per endpoint |
| **Nginx Proxy Manager** | Email + password | Hosts, certificates |
| **Pi-hole / AdGuard Home** | App password / API key | Queries, block rate |
| **Technitium DNS** | API token | Queries, blocklists |
| **Jellyseerr / Overseerr** | API key | Open requests |
| **Jellyfin / Plex / Tautulli** | API key / token | Streams, sessions, stats |
| **Nextcloud** | NC token | Storage, users, apps |
| **Immich** | API key | Library statistics |
| **Mealie** | API token | Recipes |
| **Kavita / Audiobookshelf** | Auth key / API token | Libraries, media |
| **Navidrome** | User + password | Artists, albums, tracks |
| **Paperless-ngx** | API token | Documents, inbox |
| **n8n / Grafana** | API key | Workflows / dashboards |
| **Home Assistant** | Access token | Entity state |
| **QNAP** | User + password | CPU, RAM, volume, temperature |
| **FileBrowser** | User + password | Storage |
| **Guacamole** | User + password | Connections |
| **FRITZ!Box** | — | Connection, speed (TR-064) |
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

Template: `.env.example` — read via `lib/env.ts`.

| Variable | Description | Default (dev) |
|----------|-------------|---------------|
| `ADMIN_PASSWORD` | Admin login | `admin` |
| `SESSION_SECRET` | Session + auth (min. 32 chars) | Dev fallback |
| `CREDENTIALS_ENCRYPTION_SECRET` | Widget key encryption | = `SESSION_SECRET` |
| `CREDENTIALS_ENCRYPTION_SALT` | Salt for AES key | `homelab-dashboard-salt` |
| `SESSION_COOKIE_NAME` | Cookie name | `homelab-dashboard-session` |
| `COOKIE_SECURE` | Cookie over HTTPS only | `false` |
| `DATABASE_URL` | SQLite path | `file:./data/dashboard.db` |
| `PORT` | HTTP port | `3000` (Docker: `3333`) |
| `HOSTNAME` | Bind address | `0.0.0.0` |
| `APP_STORAGE_PREFIX` | localStorage prefix (server) | `homelab-dashboard` |
| `NEXT_PUBLIC_APP_STORAGE_PREFIX` | localStorage prefix (browser) | `homelab-dashboard` |
| `MAX_BACKGROUND_UPLOAD_MB` | Background limit | `5` |
| `MAX_LOGO_UPLOAD_MB` | Logo limit | `1` |
| `MAX_ICON_UPLOAD_MB` | Icon limit | `1` |

In **production**, `ADMIN_PASSWORD` and `SESSION_SECRET` must be set.

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
| `npm run db:migrate` | Database migrations |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run lint` | ESLint |

---

## Security

- Set strong values for `ADMIN_PASSWORD` and `SESSION_SECRET` in production.
- This repo is intended for private homelab use — adjust firewall and reverse proxy accordingly.
- Widget credentials are encrypted in the DB; still grant only minimal API permissions.
- Mounting the Docker socket directly is convenient but risky — use a socket proxy.

---

## License

[MIT](LICENSE)
