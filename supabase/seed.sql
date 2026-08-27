-- Run after schema.sql. Seeds the three initial sports.
insert into sports (code, name) values
  ('mlb', 'MLB'),
  ('nba', 'NBA'),
  ('kbo', 'KBO')
on conflict (code) do nothing;
