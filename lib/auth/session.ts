import { cookies } from "next/headers";
import { signToken, verifyToken } from "./jwt";
import { UnauthorizedError } from "@/lib/errors";

const COOKIE_NAME = "denycode_session";

export async function createSession(): Promise<void> {
  const token = await signToken({ sub: "owner" });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ sub: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function requireAuth(): Promise<void> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
}