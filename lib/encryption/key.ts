import { createHash } from "crypto";

let _masterKey: Buffer | null = null;

export function getMasterKey(): Buffer {
  if (_masterKey) return _masterKey;

  const raw =
    process.env.NOTE_MASTER_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    process.env.APP_PASSWORD ||
    "denycode-default-master-encryption-key-32b";

  // If raw is already a valid 32-byte base64 encoded string, decode directly
  try {
    const fromBase64 = Buffer.from(raw, "base64");
    if (fromBase64.length === 32) {
      _masterKey = fromBase64;
      return _masterKey;
    }
  } catch {}

  // Otherwise, deterministically hash any passphrase/string to an exact 32-byte (256-bit) AES key
  _masterKey = createHash("sha256").update(raw, "utf8").digest();
  return _masterKey;
}