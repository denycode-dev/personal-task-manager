import { z } from "zod";

const envSchema = z.object({
  APP_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  NOTE_MASTER_ENCRYPTION_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  IMAGEKIT_PUBLIC_KEY: z.string().min(1),
  IMAGEKIT_PRIVATE_KEY: z.string().min(1),
  IMAGEKIT_URL_ENDPOINT: z.string().url(),
  MAX_FILE_SIZE_BYTES: z
    .string()
    .default("5242880")
    .transform(Number),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error("Invalid environment variables:", formatted);
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

// Lazy singleton so we don't crash at build time for client bundles
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) _env = validateEnv();
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env];
  },
});