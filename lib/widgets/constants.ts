export const WIDGET_TYPES = [
  { value: "qbittorrent", label: "qBittorrent" },
  { value: "proxmox", label: "Proxmox" },
  { value: "sonarr", label: "Sonarr" },
  { value: "radarr", label: "Radarr" },
  { value: "lidarr", label: "Lidarr" },
  { value: "prowlarr", label: "Prowlarr" },
  { value: "sabnzbd", label: "SABnzbd" },
  { value: "docker", label: "Docker Engine" },
  { value: "portainer", label: "Portainer" },
  { value: "pihole", label: "Pi-hole" },
  { value: "jellyseerr", label: "Jellyseerr" },
  { value: "overseerr", label: "Overseerr" },
  { value: "jellyfin", label: "Jellyfin" },
  { value: "plex", label: "Plex" },
  { value: "nextcloud", label: "Nextcloud" },
  { value: "homeassistant", label: "Home Assistant" },
  { value: "immich", label: "Immich" },
  { value: "mealie", label: "Mealie" },
  { value: "kavita", label: "Kavita" },
  { value: "technitium", label: "Technitium DNS" },
  { value: "qnap", label: "QNAP" },
  { value: "filebrowser", label: "FileBrowser" },
  { value: "guacamole", label: "Guacamole" },
  { value: "fritzbox", label: "FRITZ!Box" },
  { value: "generic", label: "Generic HTTP" },
] as const;

export const API_KEY_WIDGETS = new Set([
  "sonarr",
  "radarr",
  "lidarr",
  "prowlarr",
  "jellyseerr",
  "overseerr",
  "sabnzbd",
  "pihole",
  "portainer",
  "jellyfin",
  "immich",
  "kavita",
  "plex",
  "technitium",
  "nextcloud",
]);

export const TOKEN_WIDGETS = new Set(["homeassistant", "mealie"]);

export const USERNAME_PASSWORD_WIDGETS = new Set([
  "qbittorrent",
  "filebrowser",
  "guacamole",
  "qnap",
]);
