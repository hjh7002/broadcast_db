import { supabase } from "@/lib/supabase/server";
import type {
  Sport,
  Team,
  Player,
  SportStatField,
  PlayerContent,
  Broadcast,
  ChatMessageRow,
} from "@/lib/supabase/types";

export async function getSports(): Promise<Sport[]> {
  const { data, error } = await supabase.from("sports").select("*").order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getSportByCode(code: string): Promise<Sport | null> {
  const { data, error } = await supabase.from("sports").select("*").eq("code", code).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getTeamsForSport(sportId: string): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select("*").eq("sport_id", sportId).order("name");
  if (error) throw new Error(error.message);
  return data;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const { data, error } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getRoster(teamId: string): Promise<Player[]> {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .order("jersey_number");
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from("teams").select("*").order("name");
  if (error) throw new Error(error.message);
  return data;
}

// Looks up a team by (sport_id, name) and creates a bare row if it doesn't exist yet —
// used when preparing a broadcast from an external schedule (e.g. today's game list),
// where the two teams may not have been added to this DB before.
export async function ensureTeam(sportId: string, name: string, shortName?: string | null): Promise<string> {
  const { data: existing, error: findError } = await supabase
    .from("teams")
    .select("id")
    .eq("sport_id", sportId)
    .eq("name", name)
    .maybeSingle();
  if (findError) throw new Error(findError.message);
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("teams")
    .upsert({ sport_id: sportId, name, short_name: shortName ?? null }, { onConflict: "sport_id,name" })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function getLatestBroadcast(): Promise<Broadcast | null> {
  const { data, error } = await supabase
    .from("broadcasts")
    .select("*")
    .is("ended_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    // The `broadcasts` table is an optional add-on (see supabase/schema.sql) —
    // degrade to "no broadcast set" instead of breaking the home page if it
    // hasn't been created yet.
    console.warn("getLatestBroadcast:", error.message);
    return null;
  }
  return data;
}

export async function getEndedBroadcasts(limit = 10): Promise<Broadcast[]> {
  const { data, error } = await supabase
    .from("broadcasts")
    .select("*")
    .not("ended_at", "is", null)
    .order("ended_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.warn("getEndedBroadcasts:", error.message);
    return [];
  }
  return data;
}

export type SearchResult =
  | { type: "team"; id: string; sportCode: string; label: string; sub: string | null }
  | { type: "player"; id: string; sportCode: string; label: string; sub: string | null };

export async function search(query: string): Promise<SearchResult[]> {
  const like = `%${query}%`;
  const [teamsRes, playersRes] = await Promise.all([
    supabase
      .from("teams")
      .select("id, name, city, sports!inner(code)")
      .or(`name.ilike.${like},short_name.ilike.${like}`)
      .limit(15),
    supabase
      .from("players")
      .select("id, name, position, sports!inner(code)")
      // `bio->>name_en` covers players whose English name (backfilled from MLB)
      // is worth matching too — e.g. searching "Bello" for "브레이언 베요".
      .or(`name.ilike.${like},bio->>name_en.ilike.${like}`)
      .limit(15),
  ]);
  if (teamsRes.error) throw new Error(teamsRes.error.message);
  if (playersRes.error) throw new Error(playersRes.error.message);

  const teamResults: SearchResult[] = (teamsRes.data ?? []).map((t) => ({
    type: "team",
    id: t.id,
    sportCode: (t.sports as unknown as { code: string }).code,
    label: t.name,
    sub: t.city,
  }));
  const playerResults: SearchResult[] = (playersRes.data ?? []).map((p) => ({
    type: "player",
    id: p.id,
    sportCode: (p.sports as unknown as { code: string }).code,
    label: p.name,
    sub: p.position,
  }));
  return [...teamResults, ...playerResults];
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  const { data, error } = await supabase.from("players").select("*").eq("id", playerId).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getStatFields(sportId: string): Promise<SportStatField[]> {
  const { data, error } = await supabase
    .from("sport_stat_fields")
    .select("*")
    .eq("sport_id", sportId)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
}

export async function getPlayerContent(playerId: string): Promise<PlayerContent[]> {
  const { data, error } = await supabase
    .from("player_content")
    .select("*")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getChatHistory(limit = 200): Promise<ChatMessageRow[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) {
    // Optional add-on table (see supabase/schema.sql) — degrade to empty
    // history instead of breaking the chat widget if it hasn't been created yet.
    console.warn("getChatHistory:", error.message);
    return [];
  }
  return data;
}

export async function appendChatMessages(
  messages: { role: "user" | "assistant"; content: string }[],
): Promise<void> {
  if (messages.length === 0) return;
  const { error } = await supabase.from("chat_messages").insert(messages);
  if (error) console.warn("appendChatMessages:", error.message);
}
