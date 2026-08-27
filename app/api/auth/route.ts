import { NextResponse } from "next/server";

const COOKIE_NAME = "bcast_auth";

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  const { password } = (await req.json()) as { password?: string };
  const expectedRaw = process.env.SITE_PASSWORD;

  if (!expectedRaw || password !== expectedRaw) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(expectedRaw));
  const token = toHex(digest);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return res;
}
