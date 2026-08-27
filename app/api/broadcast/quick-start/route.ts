import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { getSportByCode, ensureTeam } from "@/lib/data";
import { mlbTeamIdForName, shortNameForMlbTeamId } from "@/lib/mlbTeams";

// Starts a broadcast directly from a schedule listing (today's game list on the home
// page) by name instead of team id — since the two teams involved may not exist in
// our `teams` table yet, they're auto-created via ensureTeam.
export async function POST(request: Request) {
  let body: { sportCode?: "mlb" | "kbo"; homeName?: string; awayName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sportCode || !body.homeName || !body.awayName) {
    return NextResponse.json({ error: "sportCode, homeName, awayName are required" }, { status: 400 });
  }

  const sport = await getSportByCode(body.sportCode);
  if (!sport) {
    return NextResponse.json({ error: `sport '${body.sportCode}' not found` }, { status: 404 });
  }

  function shortNameFor(name: string): string | null {
    if (body.sportCode !== "mlb") return null;
    const id = mlbTeamIdForName(name);
    return id ? shortNameForMlbTeamId(id) : null;
  }

  let homeTeamId: string;
  let awayTeamId: string;
  try {
    [homeTeamId, awayTeamId] = await Promise.all([
      ensureTeam(sport.id, body.homeName, shortNameFor(body.homeName)),
      ensureTeam(sport.id, body.awayName, shortNameFor(body.awayName)),
    ]);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "team lookup failed" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("broadcasts")
    .insert({ sport_id: sport.id, home_team_id: homeTeamId, away_team_id: awayTeamId })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ broadcast: data });
}
