# Changelog

All notable changes to this project are documented in this file.

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

[1.0.1]: https://github.com/MaxDeavy/dashboard/releases/tag/v1.0.1
[1.0.0]: https://github.com/MaxDeavy/dashboard/releases/tag/v1.0.0
