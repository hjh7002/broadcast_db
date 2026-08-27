import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/player-content/[contentId]">,
) {
  const { contentId } = await ctx.params;

  let body: { title?: string; body?: string; category?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.body !== undefined) updates.body = body.body;
  if (body.category !== undefined) updates.category = body.category;

  const { data, error } = await supabase
    .from("player_content")
    .update(updates)
    .eq("id", contentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/player-content/[contentId]">,
) {
  const { contentId } = await ctx.params;

  const { error } = await supabase.from("player_content").delete().eq("id", contentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
