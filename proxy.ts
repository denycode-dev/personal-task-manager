import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify, SignJWT } from "jose";
import { PUBLIC_ROUTES } from "@/config/routes";

const COOKIE_NAME = "denycode_session";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicRoute =
    PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) ||
    pathname.startsWith("/api/public") ||
    pathname.startsWith("/notes/public");

  if (isPublicRoute) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const response = NextResponse.next();

    // Sliding session: renew cookie if more than 1 day has passed since last renewal
    const exp = payload.exp as number;
    const now = Math.floor(Date.now() / 1000);
    const sevenDays = 7 * 24 * 60 * 60;
    const oneDaySecs = 24 * 60 * 60;

    if (exp - now < sevenDays - oneDaySecs) {
      const newToken = await new SignJWT({ sub: payload.sub })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(getSecret());

      response.cookies.set(COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: sevenDays,
        path: "/",
      });
    }

    return response;
  } catch {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.json|manifest.webmanifest).*)"],
};
