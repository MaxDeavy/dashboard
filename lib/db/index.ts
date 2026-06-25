import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { getDatabaseFilePath, ensureDataDirectory } from "./paths";
import * as schema from "./schema";

function isBuildTime(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}

function getDatabasePath(): string {
  if (isBuildTime()) {
    return ":memory:";
  }
  return getDatabaseFilePath();
}

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  db?: BetterSQLite3Database<typeof schema>;
};

function createDb() {
  const dbPath = getDatabasePath();
  ensureDataDirectory();

  let sqlite: Database.Database;
  try {
    sqlite = new Database(dbPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `SQLite konnte die Datenbank nicht öffnen (${dbPath}): ${message}`,
    );
  }

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return { sqlite, drizzle: drizzle(sqlite, { schema }) };
}

function getDbInstances() {
  if (globalForDb.db && globalForDb.sqlite) {
    return { db: globalForDb.db, sqlite: globalForDb.sqlite };
  }

  const { sqlite, drizzle: db } = createDb();
  globalForDb.sqlite = sqlite;
  globalForDb.db = db;
  return { db, sqlite };
}

export function closeDatabaseConnection(): void {
  if (globalForDb.sqlite) {
    globalForDb.sqlite.close();
    globalForDb.sqlite = undefined;
    globalForDb.db = undefined;
  }
}

export function checkpointDatabase(): void {
  const { sqlite: connection } = getDbInstances();
  connection.pragma("wal_checkpoint(TRUNCATE)");
}

export { getDatabaseFilePath, getDataDirectory } from "./paths";

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop, receiver) {
    const { db: connection } = getDbInstances();
    const value = Reflect.get(connection as object, prop, receiver);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(connection);
    }
    return value;
  },
});

export const sqlite = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const { sqlite: connection } = getDbInstances();
    const value = Reflect.get(connection as object, prop);
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(connection);
    }
    return value;
  },
});

export { schema };
