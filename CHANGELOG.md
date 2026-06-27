# Changelog

All notable changes to this project are documented in this file.

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

- Stealth is the default theme preset
- Custom theme colors stay independent when switching presets
- Page keyboard shortcuts are always enabled (setting removed from UI)
- Login uses a Next.js Server Action (reliable cookies behind reverse proxies)

[1.0.0]: https://github.com/MaxDeavy/dashboard/releases/tag/v1.0.0
