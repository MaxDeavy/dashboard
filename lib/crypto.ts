import crypto from "crypto";
import {
  getCredentialsEncryptionSalt,
  getCredentialsEncryptionSecret,
} from "@/lib/env";

const ALGORITHM = "aes-256-gcm";
const LEGACY_DEV_SECRET = "dev-secret-change-me";
const LEGACY_SALT = "homelab-dashboard-salt";

function deriveKey(secret: string, salt: string): Buffer {
  return crypto.scryptSync(secret, salt, 32);
}

function getEncryptionKeyCandidates(): Array<{ secret: string; salt: string }> {
  const current = {
    secret: getCredentialsEncryptionSecret(),
    salt: getCredentialsEncryptionSalt(),
  };
  const sessionSecret = process.env.SESSION_SECRET?.trim();
  const legacy = { secret: LEGACY_DEV_SECRET, salt: LEGACY_SALT };

  const candidates = [current];
  if (sessionSecret && sessionSecret !== current.secret) {
    candidates.push({ secret: sessionSecret, salt: LEGACY_SALT });
  }
  if (
    legacy.secret !== current.secret ||
    legacy.salt !== current.salt
  ) {
    candidates.push(legacy);
  }

  const seen = new Set<string>();
  return candidates.filter((entry) => {
    const key = `${entry.secret}\0${entry.salt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decryptWithKey(
  encrypted: string,
  secret: string,
  salt: string,
): string {
  const [ivHex, authTagHex, data] = encrypted.split(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    deriveKey(secret, salt),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  let decrypted = decipher.update(data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function encrypt(text: string): string {
  const secret = getCredentialsEncryptionSecret();
  const salt = getCredentialsEncryptionSalt();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, deriveKey(secret, salt), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  let lastError: unknown;

  for (const { secret, salt } of getEncryptionKeyCandidates()) {
    try {
      return decryptWithKey(encrypted, secret, salt);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }
  throw new Error("Entschlüsselung fehlgeschlagen");
}
