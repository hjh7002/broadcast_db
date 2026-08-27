-- 농구 국가대표 (basketball national team) — 대한민국 최종 로스터 12인.
-- 농구는 종목 특성상 야구/농구(NBA)와 다른 구조로 새로 설계:
--   bio: position / height_cm / birthdate / club
--   stats: PTS / REB / AST / STL / BLK / FG_PCT / FG3M / FG3_PCT / FT_PCT
-- (경기당 평균, FIBA Basketball World Cup 2027 Asian Qualifiers 2라운드 Window 4 기준)
--
-- 이 파일은 이전 basketball_national_team.sql(23인, 상세 게임로그 포함)을
-- 완전히 대체합니다 — 최종 로스터가 12인으로 확정되었기 때문.
-- 아직 한 번도 실행되지 않았다면 이 파일만 실행하면 됩니다.
--
-- Source: FIBA 선수 개인 페이지 (신장/생년월일/소속팀), KBL 공식 홈페이지
-- player DB (포지션), 나무위키 (해외/군 소속 선수 포지션 보완).

insert into sports (code, name) values
  ('bball_nt', '농구 국가대표')
on conflict (code) do nothing;

insert into teams (sport_id, name, short_name, city, extra)
select s.id, '대한민국 남자농구 국가대표팀', '대한민국', 'Korea',
  '{"competition": "FIBA Basketball World Cup 2027 Asian Qualifiers", "group": "F"}'::jsonb
from sports s
where s.code = 'bball_nt'
on conflict (sport_id, name) do update set
  extra = excluded.extra;

insert into sport_stat_fields (sport_id, stat_key, label, data_type, sort_order)
select s.id, x.stat_key, x.label, 'number', x.sort_order
from sports s
cross join (values
  ('PTS', '득점', 1),
  ('REB', '리바운드', 2),
  ('AST', '어시스트', 3),
  ('STL', '스틸', 4),
  ('BLK', '블록', 5),
  ('FG_PCT', '야투%', 6),
  ('FG3M', '3점성공', 7),
  ('FG3_PCT', '3점%', 8),
  ('FT_PCT', '자유투%', 9)
) as x(stat_key, label, sort_order)
where s.code = 'bball_nt'
on conflict (sport_id, stat_key) do update set
  label = excluded.label, sort_order = excluded.sort_order;

-- 기존 23인 로스터(있다면)를 지우고 최종 12인으로 다시 채움 — 재실행해도 안전.
delete from players p
using teams t
where p.team_id = t.id
  and t.name = '대한민국 남자농구 국가대표팀'
  and p.name not in (
    '이현중','여준석','이승현','이정현','안영준','이우석',
    '장재석','유기상','변준형','에디 다니엘','문유현','이원석'
  );

insert into players (sport_id, team_id, name, jersey_number, position, stats, bio)
select s.id, t.id, x.name, x.jersey, x.position, x.stats::jsonb, x.bio::jsonb
from sports s
join teams t on t.sport_id = s.id and t.name = '대한민국 남자농구 국가대표팀'
cross join (values
  ('이현중', 1,  '포워드',
    '{"PTS":24.8,"REB":9.8,"AST":1.5,"STL":1.8,"BLK":0,"FG_PCT":50.0,"FG3M":4.8,"FG3_PCT":44.2,"FT_PCT":88.9}',
    '{"height_cm":200,"birthdate":"2000-10-23","club":"나가사키 벨카(일본 B리그)"}'),
  ('여준석', 22, '포워드',
    '{"PTS":11.5,"REB":8.0,"AST":0.5,"STL":0,"BLK":0.5,"FG_PCT":47.8,"FG3M":0,"FG3_PCT":0,"FT_PCT":50.0}',
    '{"height_cm":202,"birthdate":"2002-03-19","club":"시애틀대학교(NCAA)"}'),
  ('이승현', 33, '포워드',
    '{"PTS":4.7,"REB":4.7,"AST":2.8,"STL":0.7,"BLK":0.3,"FG_PCT":35.1,"FG3M":0,"FG3_PCT":0,"FT_PCT":50.0}',
    '{"height_cm":197,"birthdate":"1992-04-16","club":"울산 현대모비스"}'),
  ('이정현', 6,  '가드',
    '{"PTS":13.0,"REB":1.2,"AST":5.2,"STL":0.4,"BLK":0,"FG_PCT":44.2,"FG3M":2.8,"FG3_PCT":42.4,"FT_PCT":83.3}',
    '{"height_cm":190,"birthdate":"1999-04-14","club":"고양 소노"}'),
  ('안영준', 8,  '포워드',
    '{"PTS":8.5,"REB":5.3,"AST":1.0,"STL":1.3,"BLK":0.8,"FG_PCT":42.3,"FG3M":1.0,"FG3_PCT":36.4,"FT_PCT":61.5}',
    '{"height_cm":195,"birthdate":"1995-06-28","club":"서울 SK"}'),
  ('이우석', 11, '포워드',
    '{"PTS":8.5,"REB":3.8,"AST":2.3,"STL":1.0,"BLK":0,"FG_PCT":40.6,"FG3M":0.8,"FG3_PCT":20.0,"FT_PCT":55.6}',
    '{"height_cm":196,"birthdate":"1999-07-10","club":"상무"}'),
  ('장재석', 31, '센터',
    '{"PTS":9.5,"REB":6.5,"AST":1.0,"STL":0,"BLK":0,"FG_PCT":47.1,"FG3M":0,"FG3_PCT":0,"FT_PCT":50.0}',
    '{"height_cm":203,"birthdate":"1991-02-03","club":"부산 KCC"}'),
  ('유기상', 7,  '가드',
    '{"PTS":9.8,"REB":1.3,"AST":0.5,"STL":0.5,"BLK":0,"FG_PCT":35.3,"FG3M":1.8,"FG3_PCT":26.9,"FT_PCT":88.9}',
    '{"height_cm":188,"birthdate":"2001-04-17","club":"창원 LG"}'),
  ('변준형', 5,  '가드',
    '{"PTS":4.3,"REB":2.0,"AST":4.3,"STL":0.8,"BLK":0,"FG_PCT":41.2,"FG3M":0.8,"FG3_PCT":37.5,"FT_PCT":0}',
    '{"height_cm":186,"birthdate":"1996-03-11","club":"안양 정관장"}'),
  ('에디 다니엘', 36, '포워드',
    '{"PTS":4.8,"REB":2.5,"AST":0.3,"STL":2.0,"BLK":0.3,"FG_PCT":70.0,"FG3M":0,"FG3_PCT":0,"FT_PCT":83.3}',
    '{"height_cm":189,"birthdate":"2007-04-03","club":"서울 SK"}'),
  ('문유현', 24, '가드',
    '{"PTS":4.0,"REB":0.3,"AST":2.0,"STL":1.7,"BLK":0,"FG_PCT":35.7,"FG3M":0.3,"FG3_PCT":25.0,"FT_PCT":50.0}',
    '{"height_cm":189,"birthdate":"2004-06-08","club":"안양 정관장"}'),
  ('이원석', 23, '센터',
    '{"PTS":4.0,"REB":0.7,"AST":0.3,"STL":0,"BLK":1.3,"FG_PCT":60.0,"FG3M":0,"FG3_PCT":0,"FT_PCT":100.0}',
    '{"height_cm":203,"birthdate":"2000-01-30","club":"서울 삼성(2026 상무 입대)"}')
) as x(name, jersey, position, stats, bio)
where s.code = 'bball_nt'
  and not exists (
    select 1 from players p where p.team_id = t.id and p.name = x.name
  );
