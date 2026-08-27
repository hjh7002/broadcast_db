import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "bcast_auth";

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Cookie never stores the raw password — just a hash of it, so it's safe to
// have JS-inaccessible (httpOnly) but doesn't leak the secret if inspected.
async function expectedToken(): Promise<string | null> {
  const secret = process.env.SITE_PASSWORD;
  if (!secret) return null;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return toHex(digest);
}

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const expected = await expectedToken();
  if (!expected) {
    // No SITE_PASSWORD configured — fail open locally so `npm run dev` still
    // works without setup; Vercel deploys must set the env var to be protected.
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token === expected) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
