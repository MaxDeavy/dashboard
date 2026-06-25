import type { WidgetResult } from "./base";

type Translator = (key: string) => string;

/** Maps English widget field labels to translation keys in `widgetFields`. */
const LABEL_TO_KEY: Record<string, string> = {
  "Active Streams": "activeStreams",
  "Active Torrents": "activeTorrents",
  "Active Users (5 min)": "activeUsers5min",
  "Active Sessions": "activeSessions",
  Active: "active",
  Alerts: "alerts",
  Approved: "approved",
  Artists: "artists",
  "Avg Latency": "avgLatency",
  "Block Rate": "blockRate",
  Blocked: "blocked",
  "Blocked Today": "blockedToday",
  Blocklists: "blocklists",
  Cache: "cache",
  Categories: "categories",
  Characters: "characters",
  Clients: "clients",
  Completed: "completed",
  Connections: "connections",
  CPU: "cpu",
  "CPU Load (1 min)": "cpuLoad1min",
  Dashboards: "dashboards",
  "Data Source": "dataSource",
  Documents: "documents",
  Download: "download",
  "DNS Queries": "dnsQueries",
  "DNS Queries Today": "dnsQueriesToday",
  Endpoint: "endpoint",
  Entity: "entity",
  Files: "files",
  Free: "free",
  "Free Storage": "freeStorage",
  Images: "images",
  "In Progress": "inProgress",
  Inbox: "inbox",
  Libraries: "libraries",
  Location: "location",
  Media: "media",
  Missing: "missing",
  Name: "name",
  Note: "note",
  Offline: "offline",
  Online: "online",
  Paused: "paused",
  Peers: "peers",
  Pending: "pending",
  Photos: "photos",
  Plays: "plays",
  Queue: "queue",
  "Queue Size": "queueSize",
  Queries: "queries",
  "Proxy-Hosts": "proxyHosts",
  RAM: "ram",
  Reachable: "reachable",
  Recipes: "recipes",
  Redirections: "redirections",
  Remaining: "remaining",
  "Response Time": "responseTime",
  Running: "running",
  Series: "series",
  Server: "server",
  Sessions: "sessions",
  Status: "status",
  Stopped: "stopped",
  Storage: "storage",
  Streams: "streams",
  Tags: "tags",
  Temperature: "temperature",
  "Total Containers": "totalContainers",
  "Total Indexers": "totalIndexers",
  Total: "total",
  Transcode: "transcode",
  Transcodes: "transcodes",
  Upload: "upload",
  Uptime: "uptime",
  Usage: "usage",
  Used: "used",
  Users: "users",
  Version: "version",
  Videos: "videos",
  Volume: "volume",
  "Watching Now": "watchingNow",
  Workflows: "workflows",
  "Direct Play": "directPlay",
  "Last Changed": "lastChanged",
  Timezone: "timezone",
};

/** Maps English widget error messages to translation keys in `widgetErrors`. */
const ERROR_TO_KEY: Record<string, string> = {
  "API key required": "apiKeyRequired",
  "API token required": "apiTokenRequired",
  "Email and password required": "emailPasswordRequired",
  "Login failed": "loginFailed",
  "No API key configured": "noApiKeyConfigured",
  "No API token configured": "noApiTokenConfigured",
  "No API token configured (Token-ID + Secret)": "noProxmoxTokenConfigured",
  "No API URL configured": "noApiUrlConfigured",
  "No access token configured": "noAccessTokenConfigured",
  "No credentials configured": "noCredentialsConfigured",
  "No NC token configured": "noNcTokenConfigured",
  "No Plex token configured": "noPlexTokenConfigured",
  "No URL configured": "noUrlConfigured",
  "Password required": "passwordRequired",
  "Username and password required": "usernamePasswordRequired",
  "Credentials in DB, but decryption failed (keep SESSION_SECRET unchanged and re-save token)":
    "credentialsDecryptFailed",
  Unreachable: "unreachable",
};

function translateLabel(label: string, t: Translator): string {
  const key = LABEL_TO_KEY[label];
  if (!key) return label;
  return t(key);
}

function translateError(error: string, t: Translator): string {
  const key = ERROR_TO_KEY[error];
  if (!key) return error;
  return t(key);
}

export function localizeWidgetResult(
  result: WidgetResult,
  tFields: Translator,
  tErrors: Translator,
): WidgetResult {
  return {
    ...result,
    fields: result.fields.map((field) => ({
      ...field,
      label: translateLabel(field.label, tFields),
    })),
    error: result.error ? translateError(result.error, tErrors) : undefined,
  };
}
