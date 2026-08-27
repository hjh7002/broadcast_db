-- broadcast-db schema
-- Paste this entire file into the Supabase SQL Editor and run it once.

create extension if not exists pg_trgm;

create table if not exists sports (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,        -- 'mlb' | 'nba' | 'kbo'
  name       text not null,               -- 'MLB', 'NBA', 'KBO'
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id         uuid primary key default gen_random_uuid(),
  sport_id   uuid not null references sports(id) on delete cascade,
  name       text not null,
  short_name text,
  city       text,
  extra      jsonb not null default '{}',   -- sport-specific fields, e.g. division, conference
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sport_id, name)
);

create table if not exists players (
  id            uuid primary key default gen_random_uuid(),
  sport_id      uuid not null references sports(id) on delete cascade,
  team_id       uuid references teams(id) on delete set null,
  name          text not null,
  position      text,
  jersey_number int,
  stats         jsonb not null default '{}',   -- current stat snapshot, e.g. {"HR": 44, "AVG": 0.310}
  bio           jsonb not null default '{}',   -- {"birthdate": "...", "bats": "L", ...}
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists players_stats_gin on players using gin (stats);
create index if not exists players_sport_idx on players (sport_id);
create index if not exists players_team_idx on players (team_id);
create index if not exists players_name_trgm on players using gin (name gin_trgm_ops);

-- Defines which stat keys are valid/displayable per sport, so the dashboard and
-- chatbot can validate/render stats without hardcoding per-sport columns in code.
create table if not exists sport_stat_fields (
  id         uuid primary key default gen_random_uuid(),
  sport_id   uuid not null references sports(id) on delete cascade,
  stat_key   text not null,     -- 'HR', 'AVG', 'PTS', ...
  label      text not null,     -- 'Home Runs', 'Points per Game'
  data_type  text not null default 'number',  -- 'number' | 'text'
  sort_order int not null default 0,
  unique (sport_id, stat_key)
);

-- Curated narrative content about a player: childhood/school/pre-pro episodes,
-- career background (school, draft, physique), and the historical meaning of
-- a stat achievement. Separate from the live `players.stats` snapshot.
create table if not exists player_content (
  id           uuid primary key default gen_random_uuid(),
  player_id    uuid not null references players(id) on delete cascade,
  category     text not null,   -- 'episode' | 'background' | 'stat_record' | (free to extend)
  title        text not null,
  body         text not null,
  stat_context jsonb not null default '{}',
  source_urls  text[] not null default '{}',
  occurred_at  date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists player_content_player_idx on player_content (player_id, category);

-- Audit trail: every write the chatbot makes is logged here automatically.
create table if not exists updates_log (
  id           uuid primary key default gen_random_uuid(),
  entity_type  text not null,        -- 'player' | 'team' | 'sport' | 'player_content'
  entity_id    uuid not null,
  field        text,                 -- e.g. 'stats.HR', null for full-record ops
  old_value    jsonb,
  new_value    jsonb,
  source       text not null default 'chatbot',  -- 'chatbot' | 'manual'
  user_message text,
  created_at   timestamptz not null default now()
);

-- The broadcaster's "today's matchup" — two teams they've picked to display
-- prominently while they're on air. Not tied to a real schedule/game id.
create table if not exists broadcasts (
  id             uuid primary key default gen_random_uuid(),
  sport_id       uuid not null references sports(id) on delete cascade,
  home_team_id   uuid not null references teams(id) on delete cascade,
  away_team_id   uuid not null references teams(id) on delete cascade,
  broadcast_date date not null default current_date,
  home_note      text,
  away_note      text,
  ended_at       timestamptz,   -- null = currently active; set = "종료"됨, but kept for later 재개
  created_at     timestamptz not null default now()
);

-- Persists the chatbot conversation so it survives a page reload/browser
-- close instead of living only in the widget's in-memory React state.
create table if not exists chat_messages (
  id         uuid primary key default gen_random_uuid(),
  role       text not null,   -- 'user' | 'assistant'
  content    text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on chat_messages (created_at);

-- Local-only, single-user tool: no auth, so RLS is disabled on every table.
-- IMPORTANT: if this app is ever deployed publicly, re-enable RLS and add
-- real policies BEFORE the anon key is exposed outside your own machine.
alter table sports disable row level security;
alter table teams disable row level security;
alter table players disable row level security;
alter table sport_stat_fields disable row level security;
alter table player_content disable row level security;
alter table updates_log disable row level security;
alter table broadcasts disable row level security;
alter table chat_messages disable row level security;
