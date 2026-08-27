import { NextResponse } from "next/server";
import { search } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length === 0) return NextResponse.json({ results: [] });

  const results = await search(q);
  return NextResponse.json({ results: results.slice(0, 8) });
}
