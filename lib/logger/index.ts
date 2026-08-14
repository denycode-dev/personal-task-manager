const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    if (isDev) console.log(`[INFO] ${message}`, meta ?? "");
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta ?? "");
  },
  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, error, meta ?? "");
  },
};