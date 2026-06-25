import fs from "fs";
import path from "path";
import { getDatabaseUrl } from "@/lib/env";

export function getDatabaseFilePath(): string {
  const url = getDatabaseUrl();
  if (url.startsWith("file:")) {
    const filePath = url.replace("file:", "");
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(process.cwd(), filePath);
  }
  return path.join(process.cwd(), "data", "dashboard.db");
}

export function getDataDirectory(): string {
  return path.dirname(getDatabaseFilePath());
}

export function ensureDataDirectory(): void {
  const dir = getDataDirectory();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
