import { randomBytes } from "crypto";

export function generateSlug(length: number = 12): string {
  return randomBytes(Math.ceil(length * 3 / 4))
    .toString("base64url")
    .slice(0, length);
}