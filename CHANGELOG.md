# Changelog

All notable changes to this project are documented in this file.

## [1.0.3] - 2026-06-30

### Added

- **Shift + click** to hide or show individual widget fields per service (persisted in the database)
- **3–5 additional API fields** per implemented hover widget (31 services)
- Admin setting to **hide dashboard search**
- New widget field translations (DE/EN) for enriched labels

### Changed

- Widget field visibility is stored in the **database** (`widget_configs.hidden_fields`) instead of browser localStorage — syncs across devices and backups
- **Now Playing / Watching Now** fields are only shown when someone is actively streaming
- Multiline widget values (e.g. libraries) stack vertically instead of inline separators
- Layout edit mode (Shift + drag) is separate from widget field editing; dashboard DnD is disabled while a widget panel is open
- Text selection is disabled while Shift is held during field editing

### Fixed

- **QNAP** uptime (correct `uptime_day` / `uptime_hour` / `uptime_min` / `uptime_sec` parsing)
- **Navidrome** album count via `getAlbumList2` (`x-total-count`)
- **Kavita** version via `/api/Server/server-info-slim`
- **FileBrowser** version from embedded page JSON (settings API has no version field)
- Mislabeled or duplicate widget field labels (Home Assistant, Immich, Jellyfin, FRITZ!Box, Portainer, Guacamole)

## [1.0.1] - 2026-06-30

### Added

- Richer hover-widget data for Home Assistant, Nginx Proxy Manager, Jellyfin, Navidrome, Kavita, Proxmox, and FRITZ!Box
- Iframe / embed widget type for external pages in the hover panel
- Custom dashboard background color (settings, next to background image)
- Docker images also published as `ghcr.io/maxdeavy/dashboard:latest` (in addition to version tags)
- Widget status label **Warning** for operational notices (separate from configuration issues)

### Changed

- Widget hover panel is slightly wider with improved field layout for long values
- Layout edit mode now uses **Shift** instead of Ctrl (keyboard shortcuts updated)
- Widget corner badge stays **Online** (green) when the API responds successfully; issues are shown in highlighted fields instead

### Fixed

- FRITZ!Box widget TypeScript build error (optional SOAP responses)
- Iframe widget `displayMode` type definition
- Widgets incorrectly showing orange **Configuration** although credentials and API were fine (Home Assistant, NPM, Proxmox, FRITZ!Box)

## [1.0.0] - 2026-06-27

### Added

- Self-hosted homelab dashboard with browser-based admin
- Health checks and live API hover widgets for 35+ services
- Multiple pages, Web/LAN switching, drag-and-drop layout
- Theme presets, custom colors, dark/light mode
- English and German UI (next-intl)
- Docker deployment with SQLite persistence
- Pre-built Docker images on GitHub Container Registry (`ghcr.io/maxdeavy/dashboard`)
- Optional dashboard sign-in (admin setting) with secured read APIs
- Backup and restore
- Custom icon library
- Admin example dashboard preview (`/preview`)
- Keyboard shortcuts reference in settings
- Login rate limiting
- Bcrypt support for `ADMIN_PASSWORD`
- Reverse-proxy support via `APP_URL`

### Changed

- Fresh installs start with an empty dashboard and show the login page until services are configured
- Stealth is the default theme preset
- Custom theme colors stay independent when switching presets
- Page keyboard shortcuts are always enabled (setting removed from UI)
- Login uses a Next.js Server Action (reliable cookies behind reverse proxies)

[1.0.3]: https://github.com/MaxDeavy/dashboard/releases/tag/v1.0.3
[1.0.1]: https://github.com/MaxDeavy/dashboard/releases/tag/v1.0.1
[1.0.0]: https://github.com/MaxDeavy/dashboard/releases/tag/v1.0.0
