import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: {
    player_id?: string;
    category?: string;
    title?: string;
    body?: string;
    source_urls?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.player_id || !body.category || !body.title || !body.body) {
    return NextResponse.json(
      { error: "player_id, category, title, body are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("player_content")
    .insert({
      player_id: body.player_id,
      category: body.category,
      title: body.title,
      body: body.body,
      source_urls: body.source_urls ?? [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}
