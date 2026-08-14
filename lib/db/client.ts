import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Schema = typeof schema;

let _db: NeonHttpDatabase<Schema> | null = null;

export function getDb(): NeonHttpDatabase<Schema> {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL environment variable is not set.");
    const sql = neon(url);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Proxy so callers can still write `db.select()...` directly
export const db = new Proxy({} as NeonHttpDatabase<Schema>, {
  get(_, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<Schema>];
  },
});
