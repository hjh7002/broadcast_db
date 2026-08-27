import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  let body: {
    sport_id?: string;
    home_team_id?: string;
    away_team_id?: string;
    home_note?: string;
    away_note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sport_id || !body.home_team_id || !body.away_team_id) {
    return NextResponse.json(
      { error: "sport_id, home_team_id, away_team_id are required" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("broadcasts")
    .insert({
      sport_id: body.sport_id,
      home_team_id: body.home_team_id,
      away_team_id: body.away_team_id,
      home_note: body.home_note ?? null,
      away_note: body.away_note ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ broadcast: data });
}

export async function PATCH(request: Request) {
  let body: {
    id?: string;
    home_note?: string | null;
    away_note?: string | null;
    end?: boolean;
    reactivate?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (body.home_note !== undefined) updates.home_note = body.home_note;
  if (body.away_note !== undefined) updates.away_note = body.away_note;
  // "종료"는 삭제가 아니라 ended_at만 채워서, 나중에 다시 켤(재개) 수 있게 남겨둔다.
  if (body.end) updates.ended_at = new Date().toISOString();
  if (body.reactivate) updates.ended_at = null;

  const { data, error } = await supabase
    .from("broadcasts")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ broadcast: data });
}
