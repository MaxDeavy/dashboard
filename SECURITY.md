# Security Policy

## Supported versions

Security fixes are provided for the latest release on the `main` branch.

## Reporting a vulnerability

Please report security issues privately via GitHub Security Advisories on this repository, or open a minimal issue without posting exploit details publicly.

## Deployment checklist

- Set strong, unique values for `ADMIN_PASSWORD` and `SESSION_SECRET` in production.
- Prefer a bcrypt hash for `ADMIN_PASSWORD` (`npm run hash-password -- "your-password"`).
- Set `COOKIE_SECURE=true` when serving the dashboard over HTTPS.
- Set `SESSION_MAX_AGE_DAYS` to control how long sign-in sessions remain valid (default: 7).
- Enable **Dashboard requires sign-in** in admin settings when the instance is reachable beyond trusted networks.
- Do not commit `.env` files or database backups with widget credentials.
- Mount the Docker socket only via a restricted proxy, not directly.
- Grant widget API tokens the minimum permissions required.
- Keep the instance behind a firewall or reverse proxy with authentication if exposed beyond your LAN.

## Defaults (development only)

Without production env vars, the app falls back to development defaults (`ADMIN_PASSWORD=admin`, dev session secret). These must never be used on a public-facing deployment.
