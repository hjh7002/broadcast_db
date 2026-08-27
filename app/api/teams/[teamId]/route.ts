import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/teams/[teamId]">,
) {
  const { teamId } = await ctx.params;

  let body: { extra?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("teams")
    .select("extra")
    .eq("id", teamId)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.extra !== undefined) {
    updates.extra = { ...(existing.extra as Record<string, unknown>), ...body.extra };
  }

  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ team: data });
}
