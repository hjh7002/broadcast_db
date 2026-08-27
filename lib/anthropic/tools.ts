import type Anthropic from "@anthropic-ai/sdk";

// Custom (client-executed) tools. The web_search server tool is added
// separately in app/api/chat/route.ts alongside these.
export const customTools: Anthropic.Tool[] = [
  {
    name: "search_team",
    description:
      "Find teams by (partial, case-insensitive) name, optionally scoped to a sport. Always call this before upsert_team to check whether the team already exists and to resolve its id.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Team name or partial name to search for" },
        sport_code: {
          type: "string",
          description: "Optional sport filter, e.g. 'mlb', 'nba', 'kbo'",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "search_player",
    description:
      "Find players by (partial, case-insensitive) name, optionally scoped to a sport or team. Always call this before upsert_player, update_player_stat, or add_player_content to resolve the correct player id and avoid creating a duplicate.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Player name or partial name" },
        sport_code: { type: "string", description: "Optional sport filter, e.g. 'mlb', 'nba', 'kbo'" },
        team_id: { type: "string", description: "Optional team UUID filter" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "list_sports",
    description:
      "List all sports currently tracked (code + name). Use this to resolve a sport_code before creating a team or player, or to check whether a sport already exists before calling add_sport.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "update_player_stat",
    description:
      "Update a single stat field on an existing player, merging into their stats without touching any other field. Use this for requests like 'update Ohtani's home run count to 44'. Requires a resolved player_id from search_player.",
    input_schema: {
      type: "object",
      properties: {
        player_id: { type: "string", description: "Player UUID from search_player" },
        stat_key: { type: "string", description: "Stat key, e.g. 'HR', 'AVG', 'PTS', 'SO'" },
        value: {
          anyOf: [{ type: "number" }, { type: "string" }],
          description: "The new value for this stat",
        },
      },
      required: ["player_id", "stat_key", "value"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "upsert_player",
    description:
      "Create a new player, or update non-stat fields (position, jersey number, bio, team) on an existing one. To update a single stat value, use update_player_stat instead. Omit player_id to create a new player.",
    input_schema: {
      type: "object",
      properties: {
        player_id: { type: "string", description: "Existing player UUID to update; omit to create a new player" },
        sport_code: { type: "string", description: "Sport code, e.g. 'mlb', 'nba', 'kbo' (required when creating)" },
        team_id: { type: "string", description: "Team UUID from search_team" },
        name: { type: "string" },
        position: { type: "string" },
        jersey_number: { type: "integer" },
        bio: { type: "object", description: 'Free-form bio fields, e.g. {"birthdate": "1994-07-05", "bats": "L"}' },
      },
      required: ["sport_code", "name"],
      additionalProperties: false,
      // Not strict: `bio` is a genuinely free-form object, which strict mode
      // (additionalProperties: false on every nested object) can't express.
    },
  },
  {
    name: "upsert_team",
    description: "Create a new team, or update an existing one's name/city/extra fields. Omit team_id to create a new team.",
    input_schema: {
      type: "object",
      properties: {
        team_id: { type: "string" },
        sport_code: { type: "string" },
        name: { type: "string" },
        short_name: { type: "string" },
        city: { type: "string" },
        extra: { type: "object", description: 'Free-form fields, e.g. {"division": "AL West"}' },
      },
      required: ["sport_code", "name"],
      additionalProperties: false,
    },
  },
  {
    name: "add_sport",
    description:
      "Register a new sport so it appears as a dashboard tab. Only use this when the broadcaster explicitly asks to start tracking a new sport.",
    input_schema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Short lowercase code, e.g. 'nfl'" },
        name: { type: "string", description: "Display name, e.g. 'NFL'" },
      },
      required: ["code", "name"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "add_player_content",
    description:
      "Save curated narrative content about a player. Use category='episode' for childhood/school/pre- or post-debut anecdotes and personal stories; category='background' for meaningful career-background facts (school, draft info, physical measurements, career milestones); category='stat_record' for the historical significance of a stat achievement (e.g. what a 54 HR / 59 SB season means). If the content came from web_search, always include the source URLs in source_urls.",
    input_schema: {
      type: "object",
      properties: {
        player_id: { type: "string", description: "Player UUID from search_player" },
        category: {
          type: "string",
          enum: ["episode", "background", "stat_record"],
        },
        title: { type: "string" },
        body: { type: "string", description: "The full write-up, in Korean unless the user wrote in another language" },
        stat_context: { type: "object", description: 'Optional related numbers, e.g. {"HR": 54, "SB": 59}' },
        source_urls: { type: "array", items: { type: "string" }, description: "Source URLs, if any" },
        occurred_at: { type: "string", description: "ISO date this happened/is set, if known" },
      },
      required: ["player_id", "category", "title", "body"],
      additionalProperties: false,
    },
  },
];
