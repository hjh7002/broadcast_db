import { supabase } from "@/lib/supabase/server";

export type ToolContext = { userMessage: string };
export type ToolResult = { output: unknown; isError?: boolean };

async function resolveSportId(sportCode: string): Promise<string> {
  const { data, error } = await supabase
    .from("sports")
    .select("id")
    .eq("code", sportCode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    throw new Error(
      `No sport with code '${sportCode}'. Call list_sports to see existing sports, or add_sport to create one first.`,
    );
  }
  return data.id as string;
}

async function logUpdate(entry: {
  entityType: string;
  entityId: string;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  userMessage: string;
}) {
  const { error } = await supabase.from("updates_log").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    field: entry.field ?? null,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    source: "chatbot",
    user_message: entry.userMessage,
  });
  // Logging failures should never break the chat response.
  if (error) console.error("Failed to write updates_log:", error.message);
}

async function listSports() {
  const { data, error } = await supabase.from("sports").select("*").order("name");
  if (error) throw new Error(error.message);
  return data;
}

async function searchTeam(input: { query: string; sport_code?: string }) {
  let q = supabase
    .from("teams")
    .select("id, name, short_name, city, sport_id, sports!inner(code, name)")
    .ilike("name", `%${input.query}%`);
  if (input.sport_code) q = q.eq("sports.code", input.sport_code);
  const { data, error } = await q.limit(10);
  if (error) throw new Error(error.message);
  return data;
}

async function searchPlayer(input: { query: string; sport_code?: string; team_id?: string }) {
  let q = supabase
    .from("players")
    .select("id, name, position, jersey_number, stats, bio, team_id, sport_id, sports!inner(code, name)")
    .ilike("name", `%${input.query}%`);
  if (input.sport_code) q = q.eq("sports.code", input.sport_code);
  if (input.team_id) q = q.eq("team_id", input.team_id);
  const { data, error } = await q.limit(10);
  if (error) throw new Error(error.message);
  return data;
}

async function updatePlayerStat(
  input: { player_id: string; stat_key: string; value: number | string },
  ctx: ToolContext,
) {
  const { data: player, error: fetchErr } = await supabase
    .from("players")
    .select("id, stats")
    .eq("id", input.player_id)
    .maybeSingle();
  if (fetchErr) throw new Error(fetchErr.message);
  if (!player) throw new Error(`No player with id '${input.player_id}'. Call search_player first.`);

  const stats = player.stats as Record<string, unknown>;
  const oldValue = stats[input.stat_key] ?? null;
  const newStats = { ...stats, [input.stat_key]: input.value };

  const { error: updateErr } = await supabase
    .from("players")
    .update({ stats: newStats, updated_at: new Date().toISOString() })
    .eq("id", input.player_id);
  if (updateErr) throw new Error(updateErr.message);

  await logUpdate({
    entityType: "player",
    entityId: input.player_id,
    field: `stats.${input.stat_key}`,
    oldValue,
    newValue: input.value,
    userMessage: ctx.userMessage,
  });

  return { player_id: input.player_id, stat_key: input.stat_key, old_value: oldValue, new_value: input.value };
}

async function upsertPlayer(
  input: {
    player_id?: string;
    sport_code: string;
    team_id?: string;
    name: string;
    position?: string;
    jersey_number?: number;
    bio?: Record<string, unknown>;
  },
  ctx: ToolContext,
) {
  if (input.player_id) {
    const { data: existing, error: fetchErr } = await supabase
      .from("players")
      .select("*")
      .eq("id", input.player_id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!existing) throw new Error(`No player with id '${input.player_id}'.`);

    const mergedBio = input.bio
      ? { ...(existing.bio as Record<string, unknown>), ...input.bio }
      : existing.bio;

    const updates = {
      name: input.name ?? existing.name,
      team_id: input.team_id ?? existing.team_id,
      position: input.position ?? existing.position,
      jersey_number: input.jersey_number ?? existing.jersey_number,
      bio: mergedBio,
      updated_at: new Date().toISOString(),
    };
    const { data: updated, error: updateErr } = await supabase
      .from("players")
      .update(updates)
      .eq("id", input.player_id)
      .select()
      .single();
    if (updateErr) throw new Error(updateErr.message);

    await logUpdate({
      entityType: "player",
      entityId: input.player_id,
      oldValue: existing,
      newValue: updated,
      userMessage: ctx.userMessage,
    });
    return updated;
  }

  const sportId = await resolveSportId(input.sport_code);
  const { data: created, error: insertErr } = await supabase
    .from("players")
    .insert({
      sport_id: sportId,
      team_id: input.team_id ?? null,
      name: input.name,
      position: input.position ?? null,
      jersey_number: input.jersey_number ?? null,
      bio: input.bio ?? {},
    })
    .select()
    .single();
  if (insertErr) throw new Error(insertErr.message);

  await logUpdate({
    entityType: "player",
    entityId: created.id,
    oldValue: null,
    newValue: created,
    userMessage: ctx.userMessage,
  });
  return created;
}

async function upsertTeam(
  input: {
    team_id?: string;
    sport_code: string;
    name: string;
    short_name?: string;
    city?: string;
    extra?: Record<string, unknown>;
  },
  ctx: ToolContext,
) {
  if (input.team_id) {
    const { data: existing, error: fetchErr } = await supabase
      .from("teams")
      .select("*")
      .eq("id", input.team_id)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!existing) throw new Error(`No team with id '${input.team_id}'.`);

    const mergedExtra = input.extra
      ? { ...(existing.extra as Record<string, unknown>), ...input.extra }
      : existing.extra;

    const updates = {
      name: input.name ?? existing.name,
      short_name: input.short_name ?? existing.short_name,
      city: input.city ?? existing.city,
      extra: mergedExtra,
      updated_at: new Date().toISOString(),
    };
    const { data: updated, error: updateErr } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", input.team_id)
      .select()
      .single();
    if (updateErr) throw new Error(updateErr.message);

    await logUpdate({
      entityType: "team",
      entityId: input.team_id,
      oldValue: existing,
      newValue: updated,
      userMessage: ctx.userMessage,
    });
    return updated;
  }

  const sportId = await resolveSportId(input.sport_code);
  const { data: created, error: insertErr } = await supabase
    .from("teams")
    .insert({
      sport_id: sportId,
      name: input.name,
      short_name: input.short_name ?? null,
      city: input.city ?? null,
      extra: input.extra ?? {},
    })
    .select()
    .single();
  if (insertErr) throw new Error(insertErr.message);

  await logUpdate({
    entityType: "team",
    entityId: created.id,
    oldValue: null,
    newValue: created,
    userMessage: ctx.userMessage,
  });
  return created;
}

async function addSport(input: { code: string; name: string }, ctx: ToolContext) {
  const { data: created, error } = await supabase
    .from("sports")
    .insert({ code: input.code, name: input.name })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logUpdate({
    entityType: "sport",
    entityId: created.id,
    oldValue: null,
    newValue: created,
    userMessage: ctx.userMessage,
  });
  return created;
}

async function addPlayerContent(
  input: {
    player_id: string;
    category: string;
    title: string;
    body: string;
    stat_context?: Record<string, unknown>;
    source_urls?: string[];
    occurred_at?: string;
  },
  ctx: ToolContext,
) {
  const { data: created, error } = await supabase
    .from("player_content")
    .insert({
      player_id: input.player_id,
      category: input.category,
      title: input.title,
      body: input.body,
      stat_context: input.stat_context ?? {},
      source_urls: input.source_urls ?? [],
      occurred_at: input.occurred_at ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await logUpdate({
    entityType: "player_content",
    entityId: created.id,
    oldValue: null,
    newValue: created,
    userMessage: ctx.userMessage,
  });
  return created;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeTool(name: string, input: any, ctx: ToolContext): Promise<ToolResult> {
  try {
    switch (name) {
      case "list_sports":
        return { output: await listSports() };
      case "search_team":
        return { output: await searchTeam(input) };
      case "search_player":
        return { output: await searchPlayer(input) };
      case "update_player_stat":
        return { output: await updatePlayerStat(input, ctx) };
      case "upsert_player":
        return { output: await upsertPlayer(input, ctx) };
      case "upsert_team":
        return { output: await upsertTeam(input, ctx) };
      case "add_sport":
        return { output: await addSport(input, ctx) };
      case "add_player_content":
        return { output: await addPlayerContent(input, ctx) };
      default:
        return { output: `Unknown tool: ${name}`, isError: true };
    }
  } catch (err) {
    return { output: err instanceof Error ? err.message : String(err), isError: true };
  }
}
