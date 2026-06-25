/** Standard-Icons aus dem mitgelieferten `assets/`-Ordner (unter `/assets/` ausgeliefert). */
export const DEFAULT_SERVICE_ICONS: Record<string, string> = {
  Homeassistant: "/assets/ha.png",
  Immich: "/assets/immich.webp",
  Nextcloud: "/assets/nextcloud.png",
  Trilium: "/assets/trilium.webp",
  Jellyfin: "/assets/jelly.webp",
  Finamp: "/assets/finamp.webp",
  Mealie: "/assets/mealie.webp",
  Plex: "/assets/plex.png",
  Requests: "/assets/jellyseerr.png",
  Radarr: "/assets/radarr.png",
  Sonarr: "/assets/sonarr.png",
  Lidarr: "/assets/lidarr.png",
  SabNZB: "/assets/sab.png",
  qBittorrent: "/assets/qbit.png",
  Prowlarr: "/assets/prowlarr.png",
  Homarr: "/assets/homar.png",
  Proxmox: "/assets/proxmox.png",
  Portainer: "/assets/portainer.png",
  Filebrowser: "/assets/files.png",
  Guacamole: "/assets/guacamole.png",
  "FRITZ!Box": "/assets/fritz.png",
  "Filebrowser A": "/assets/files.png",
  "Guacamole A": "/assets/guacamole.png",
  "FRITZ!Box A": "/assets/fritz.png",
  "Filebrowser B": "/assets/files.png",
  "Guacamole B": "/assets/guacamole.png",
  "FRITZ!Box B": "/assets/fritz.png",
  Intranet: "/assets/io.png",
  Portal: "/assets/gitlab.png",
  Helpdesk: "/assets/helpdesk.png",
  Kalender: "/assets/ontime.jpg",
  Wiki: "/assets/io.png",
  Monitoring: "/assets/uptime.png",
  Checkmk: "/assets/checkmk.webp",
  GitLab: "/assets/gitlab.png",
};

/** Emojis aus dem ursprünglichen Seed — werden bei Migration auf Asset-Icons umgestellt. */
export const LEGACY_EMOJI_ICONS = new Set([
  "🏠", "📷", "☁️", "📝", "🎬", "🎵", "🍳", "📺",
  "📋", "🎥", "🎧", "📦", "⬇️", "🔍", "📊",
  "🖥️", "🐳", "📁", "🖱️", "📡",
  "🏢", "👥", "🎫", "📅", "📖", "🎯", "💻", "🦊",
]);

export const BUNDLED_ICON_OPTIONS: Array<{ label: string; url: string }> = [
  { label: "Home Assistant", url: "/assets/ha.png" },
  { label: "Immich", url: "/assets/immich.webp" },
  { label: "Nextcloud", url: "/assets/nextcloud.png" },
  { label: "Trilium", url: "/assets/trilium.webp" },
  { label: "Jellyfin", url: "/assets/jelly.webp" },
  { label: "Finamp", url: "/assets/finamp.webp" },
  { label: "Mealie", url: "/assets/mealie.webp" },
  { label: "Plex", url: "/assets/plex.png" },
  { label: "Jellyseerr", url: "/assets/jellyseerr.png" },
  { label: "Radarr", url: "/assets/radarr.png" },
  { label: "Sonarr", url: "/assets/sonarr.png" },
  { label: "Lidarr", url: "/assets/lidarr.png" },
  { label: "Readarr", url: "/assets/readarr.png" },
  { label: "SabNZB", url: "/assets/sab.png" },
  { label: "qBittorrent", url: "/assets/qbit.png" },
  { label: "Prowlarr", url: "/assets/prowlarr.png" },
  { label: "Homarr", url: "/assets/homar.png" },
  { label: "Proxmox", url: "/assets/proxmox.png" },
  { label: "Portainer", url: "/assets/portainer.png" },
  { label: "Pi-hole", url: "/assets/pihole.png" },
  { label: "Filebrowser", url: "/assets/files.png" },
  { label: "Guacamole", url: "/assets/guacamole.png" },
  { label: "FRITZ!Box", url: "/assets/fritz.png" },
  { label: "Helpdesk", url: "/assets/helpdesk.png" },
  { label: "GitLab", url: "/assets/gitlab.png" },
  { label: "Nginx Proxy Manager", url: "/assets/npm.webp" },
  { label: "n8n", url: "/assets/n8n.png" },
  { label: "Cloudflare", url: "/assets/cloudflare.png" },
  { label: "Uptime Kuma", url: "/assets/uptime.png" },
  { label: "Checkmk", url: "/assets/checkmk.webp" },
  { label: "QNAP", url: "/assets/qnap.webp" },
  { label: "Kavita", url: "/assets/kavita.png" },
  { label: "Navidrome", url: "/assets/navidrome.png" },
  { label: "Spotify", url: "/assets/spotify.png" },
  { label: "YouTube", url: "/assets/youtube.png" },
  { label: "ChatGPT", url: "/assets/chatgpt.png" },
  { label: "Gemini", url: "/assets/gemini.png" },
  { label: "Gmail", url: "/assets/gmail.png" },
  { label: "WhatsApp", url: "/assets/whatsapp.png" },
  { label: "Google", url: "/assets/google.webp" },
];

export function isImageIcon(icon: string | null | undefined): boolean {
  if (!icon) return false;
  const value = icon.trim();
  if (!value) return false;
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value.startsWith("/api/")
  );
}

export function isCustomUploadedIcon(icon: string | null | undefined): boolean {
  return Boolean(icon?.includes("/api/uploads/icon"));
}

export type IconOption = { label: string; url: string };

export function mergeIconOptions(
  bundled: IconOption[],
  custom: IconOption[],
): IconOption[] {
  const seen = new Set(bundled.map((option) => option.url));
  const merged = [...bundled];

  for (const option of custom) {
    if (!seen.has(option.url)) {
      merged.push(option);
      seen.add(option.url);
    }
  }

  return merged.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}
