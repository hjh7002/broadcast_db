import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/players/[playerId]">,
) {
  const { playerId } = await ctx.params;

  let body: {
    name?: string;
    position?: string | null;
    jersey_number?: number | null;
    team_id?: string | null;
    bio?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("players")
    .select("bio")
    .eq("id", playerId)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!existing) return NextResponse.json({ error: "Player not found" }, { status: 404 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.position !== undefined) updates.position = body.position;
  if (body.jersey_number !== undefined) updates.jersey_number = body.jersey_number;
  if (body.team_id !== undefined) updates.team_id = body.team_id;
  if (body.bio !== undefined) {
    updates.bio = { ...(existing.bio as Record<string, unknown>), ...body.bio };
  }

  const { data, error } = await supabase
    .from("players")
    .update(updates)
    .eq("id", playerId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data });
}
