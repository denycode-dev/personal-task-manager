import { comparePassword } from "@/lib/auth/password";
import { checkRateLimit, resetRateLimit } from "@/lib/auth/rate-limit";

const RATE_LIMIT_KEY = "login";

export type LoginResult =
  | { success: true }
  | { success: false; error: string; retryAfterMs?: number };

export async function login(password: string): Promise<LoginResult> {
  const { allowed, retryAfterMs } = checkRateLimit(RATE_LIMIT_KEY);

  if (!allowed) {
    const minutes = Math.ceil(retryAfterMs / 60000);
    return {
      success: false,
      error: `Terlalu banyak percobaan. Coba lagi dalam ${minutes} menit.`,
      retryAfterMs,
    };
  }

  const appPassword = process.env.APP_PASSWORD!;
  // Direct comparison for simple app password (not hashed in env)
  const isValid = password === appPassword;

  if (!isValid) {
    return { success: false, error: "Password salah. Silakan coba lagi." };
  }

  resetRateLimit(RATE_LIMIT_KEY);
  return { success: true };
}