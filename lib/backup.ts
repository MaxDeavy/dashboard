import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import {
  checkpointDatabase,
  closeDatabaseConnection,
  getDataDirectory,
  getDatabaseFilePath,
} from "@/lib/db";
import { getUploadsDir } from "@/lib/uploads";

const MANIFEST_VERSION = 1;
const MANIFEST_FILE = "manifest.json";
const DB_ARCHIVE_PATH = "database/dashboard.db";
const UPLOADS_ARCHIVE_PREFIX = "uploads/";

export interface BackupManifest {
  version: number;
  app: string;
  createdAt: string;
  includesUploads: boolean;
}

function createManifest(includesUploads: boolean): BackupManifest {
  return {
    version: MANIFEST_VERSION,
    app: "homelab-dashboard",
    createdAt: new Date().toISOString(),
    includesUploads,
  };
}

function addDirectoryToZip(zip: AdmZip, sourceDir: string, archivePrefix: string) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const archivePath = path.posix.join(archivePrefix, entry.name);
    if (entry.isDirectory()) {
      addDirectoryToZip(zip, sourcePath, archivePath);
    } else if (entry.isFile()) {
      zip.addLocalFile(sourcePath, path.posix.dirname(archivePath));
    }
  }
}

function removeDirectoryContents(dir: string) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(entryPath);
    }
  }
}

function removeWalFiles(dbPath: string) {
  for (const suffix of ["-wal", "-shm"]) {
    const walPath = `${dbPath}${suffix}`;
    if (fs.existsSync(walPath)) {
      fs.unlinkSync(walPath);
    }
  }
}

function parseManifest(zip: AdmZip): BackupManifest {
  const entry = zip.getEntry(MANIFEST_FILE);
  if (!entry) {
    throw new Error("Ungültiges Backup: manifest.json fehlt");
  }

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(entry.getData().toString("utf8")) as BackupManifest;
  } catch {
    throw new Error("Ungültiges Backup: manifest.json ist beschädigt");
  }

  if (manifest.app !== "homelab-dashboard" || manifest.version !== MANIFEST_VERSION) {
    throw new Error("Ungültiges oder inkompatibles Backup");
  }

  const dbEntry = zip.getEntry(DB_ARCHIVE_PATH);
  if (!dbEntry) {
    throw new Error("Ungültiges Backup: Datenbank fehlt");
  }

  return manifest;
}

export function createBackupArchive(): Buffer {
  checkpointDatabase();

  const dbPath = getDatabaseFilePath();
  if (!fs.existsSync(dbPath)) {
    throw new Error("Datenbankdatei nicht gefunden");
  }

  const uploadsDir = getUploadsDir();
  const includesUploads = fs.existsSync(uploadsDir);

  const zip = new AdmZip();
  zip.addFile(
    MANIFEST_FILE,
    Buffer.from(JSON.stringify(createManifest(includesUploads), null, 2), "utf8"),
  );
  zip.addLocalFile(dbPath, path.posix.dirname(DB_ARCHIVE_PATH));

  if (includesUploads) {
    addDirectoryToZip(zip, uploadsDir, UPLOADS_ARCHIVE_PREFIX.replace(/\/$/, ""));
  }

  return zip.toBuffer();
}

export function restoreBackupArchive(buffer: Buffer): void {
  const zip = new AdmZip(buffer);
  const manifest = parseManifest(zip);

  const dbPath = getDatabaseFilePath();
  const dataDir = getDataDirectory();
  const uploadsDir = getUploadsDir();

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  closeDatabaseConnection();

  const dbEntry = zip.getEntry(DB_ARCHIVE_PATH);
  if (!dbEntry) {
    throw new Error("Ungültiges Backup: Datenbank fehlt");
  }

  fs.writeFileSync(dbPath, dbEntry.getData());
  removeWalFiles(dbPath);

  if (manifest.includesUploads) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    removeDirectoryContents(uploadsDir);

    for (const entry of zip.getEntries()) {
      if (
        entry.isDirectory ||
        !entry.entryName.startsWith(UPLOADS_ARCHIVE_PREFIX) ||
        entry.entryName === UPLOADS_ARCHIVE_PREFIX
      ) {
        continue;
      }

      const relativePath = entry.entryName.slice(UPLOADS_ARCHIVE_PREFIX.length);
      const targetPath = path.join(uploadsDir, relativePath);
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, entry.getData());
    }
  }
}
