export type Sport = {
  id: string;
  code: string;
  name: string;
  extra: Record<string, unknown>;
  created_at: string;
};

export type Team = {
  id: string;
  sport_id: string;
  name: string;
  short_name: string | null;
  city: string | null;
  extra: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Player = {
  id: string;
  sport_id: string;
  team_id: string | null;
  name: string;
  position: string | null;
  jersey_number: number | null;
  stats: Record<string, unknown>;
  bio: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SportStatField = {
  id: string;
  sport_id: string;
  stat_key: string;
  label: string;
  data_type: "number" | "text";
  sort_order: number;
};

export type Broadcast = {
  id: string;
  sport_id: string;
  home_team_id: string;
  away_team_id: string;
  broadcast_date: string;
  home_note: string | null;
  away_note: string | null;
  ended_at: string | null;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type PlayerContentCategory = "episode" | "background" | "stat_record" | string;

export type PlayerContent = {
  id: string;
  player_id: string;
  category: PlayerContentCategory;
  title: string;
  body: string;
  stat_context: Record<string, unknown>;
  source_urls: string[];
  occurred_at: string | null;
  created_at: string;
  updated_at: string;
};
