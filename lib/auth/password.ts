import bcrypt from "bcryptjs";
import { timingSafeEqual, createHash } from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Constant-time comparison for plain strings (e.g. app passwords, tokens).
 * Hashes both inputs to 32-byte SHA-256 buffers first to normalize lengths
 * and prevent timing/length-leak side-channel attacks.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const hashA = createHash("sha256").update(a, "utf8").digest();
  const hashB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(hashA, hashB);
}