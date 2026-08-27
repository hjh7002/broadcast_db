-- 농구 국가대표 — 레바논 최종 로스터 24인 (basketball_national_team.sql 이후 실행).
-- 대한민국과 동일한 구조: bio(position/height_cm/birthdate/club),
-- stats(PTS/REB/AST/STL/BLK/FG_PCT/FG3M/FG3_PCT/FT_PCT, 경기당 평균).
--
-- Funderburk/Ezzedine/El Jamal/Naba 4명은 이번 예선 캠페인에서 아직 출전 기록이
-- 없는 신규 소집 선수라 stats가 전부 0/없음 — 첫 출전 후 업데이트 필요.
--
-- 포지션 출처: 위키피디아 "Lebanon men's national basketball team"(2025 Asia Cup
-- 로스터 표) 및 개별 검색 확인 — 일부 백업 선수(Alkhoury/Khalil/Abou Samra/Saleh/
-- Zamatta/Khoueiry/El Jamal)는 확정 소스가 없어 신장 기준 추정치임(주석 표시).
-- 신장/생년월일/소속팀 출처: FIBA 선수 개인 페이지.

insert into teams (sport_id, name, short_name, city, extra)
select s.id, '레바논 남자농구 국가대표팀', '레바논', 'Lebanon',
  '{"competition": "FIBA Basketball World Cup 2027 Asian Qualifiers", "group": "F"}'::jsonb
from sports s
where s.code = 'bball_nt'
on conflict (sport_id, name) do update set
  extra = excluded.extra;

-- 이전에 넣었던 20인(구버전 필드 구조) 로스터를 지우고 확정 24인으로 재구성.
delete from players p
using teams t
where p.team_id = t.id
  and t.name = '레바논 남자농구 국가대표팀';

insert into players (sport_id, team_id, name, jersey_number, position, stats, bio)
select s.id, t.id, x.name, x.jersey, x.position, x.stats::jsonb, x.bio::jsonb
from sports s
join teams t on t.sport_id = s.id and t.name = '레바논 남자농구 국가대표팀'
cross join (values
  ('Joseph Abou Samra', 6,  '가드',   -- 추정(신장 193cm 기준)
    '{"PTS":2,"REB":0,"AST":1,"STL":0,"BLK":0,"FG_PCT":33.3,"FG3M":0,"FG3_PCT":0,"FT_PCT":0}',
    '{"height_cm":193,"birthdate":"2004-05-20","club":"Beirut Club"}'),
  ('Mark Alkhoury', 0, '포워드',   -- 추정(신장 196cm 기준)
    '{"PTS":6.3,"REB":4,"AST":1,"STL":0.7,"BLK":0,"FG_PCT":60.0,"FG3M":0,"FG3_PCT":0,"FT_PCT":50.0}',
    '{"height_cm":196,"birthdate":"1998-02-22","club":"Antonine"}'),
  ('Wael Arakji', 20, '가드',
    '{"PTS":19.3,"REB":4.3,"AST":5,"STL":0.7,"BLK":0,"FG_PCT":51.3,"FG3M":1,"FG3_PCT":27.3,"FT_PCT":83.3}',
    '{"height_cm":193,"birthdate":"1994-09-04","club":"Al Riyadi"}'),
  ('Sergio El Darwich', 9, '가드',
    '{"PTS":13.6,"REB":5,"AST":4.6,"STL":1.4,"BLK":0.4,"FG_PCT":50.0,"FG3M":1,"FG3_PCT":38.5,"FT_PCT":70.8}',
    '{"height_cm":194,"birthdate":"1996-07-25","club":"Sendai 89ers(일본 B리그)"}'),
  ('Omar El Jamal', 18, '포워드',   -- 추정(신장 203cm 기준)
    '{"PTS":null,"REB":null,"AST":null,"STL":null,"BLK":null,"FG_PCT":null,"FG3M":null,"FG3_PCT":null,"FT_PCT":null}',
    '{"height_cm":203,"birthdate":"2003-09-18","club":"Hoops Club"}'),
  ('Jihad Elkhatib', 15, '포워드',   -- 추정(신장 203cm 기준)
    '{"PTS":11.6,"REB":2.8,"AST":0.6,"STL":0.8,"BLK":0.2,"FG_PCT":55.0,"FG3M":1.4,"FG3_PCT":46.7,"FT_PCT":77.8}',
    '{"height_cm":203,"birthdate":"2005-08-24","club":"Central"}'),
  ('Karim Ezzedine', null, '센터',
    '{"PTS":null,"REB":null,"AST":null,"STL":null,"BLK":null,"FG_PCT":null,"FG3M":null,"FG3_PCT":null,"FT_PCT":null}',
    '{"height_cm":206,"birthdate":"1997-08-08","club":"Al Markaziyyah Jounieh"}'),
  ('DJ Funderburk', null, '센터',
    '{"PTS":null,"REB":null,"AST":null,"STL":null,"BLK":null,"FG_PCT":null,"FG3M":null,"FG3_PCT":null,"FT_PCT":null}',
    '{"height_cm":208,"birthdate":"1997-04-12","club":"Anwil Włocławek(폴란드)"}'),
  ('Hayk Gyokchyan', 24, '포워드',
    '{"PTS":8.7,"REB":4,"AST":2,"STL":0.7,"BLK":1.3,"FG_PCT":52.6,"FG3M":2,"FG3_PCT":54.5,"FT_PCT":0}',
    '{"height_cm":203,"birthdate":"1989-12-11","club":"Al Riyadi"}'),
  ('Gerard Hadidian', 34, '센터',
    '{"PTS":8.7,"REB":3.5,"AST":0.7,"STL":0.5,"BLK":0.7,"FG_PCT":57.6,"FG3M":0.2,"FG3_PCT":100.0,"FT_PCT":86.7}',
    '{"height_cm":202,"birthdate":"1995-04-21","club":"C.S. Sagesse"}'),
  ('Ali Haidar', 40, '포워드',
    '{"PTS":5,"REB":3,"AST":0,"STL":0,"BLK":0,"FG_PCT":27.3,"FG3M":0,"FG3_PCT":0,"FT_PCT":66.7}',
    '{"height_cm":206,"birthdate":"1990-07-20","club":"C.S. Sagesse"}'),
  ('Omar Jamaleddine', 1, '포워드',
    '{"PTS":6,"REB":4.3,"AST":2.7,"STL":1.7,"BLK":0,"FG_PCT":29.2,"FG3M":0.7,"FG3_PCT":18.2,"FT_PCT":50.0}',
    '{"height_cm":192,"birthdate":"2000-06-13","club":"Kawasaki Brave Thunders(일본 B리그)"}'),
  ('Jad Khalil', 8, '가드',   -- 추정(신장 185cm 기준)
    '{"PTS":3,"REB":4,"AST":1,"STL":1,"BLK":0,"FG_PCT":33.3,"FG3M":0,"FG3_PCT":0,"FT_PCT":33.3}',
    '{"height_cm":185,"birthdate":"1996-11-20","club":"C.S. Sagesse"}'),
  ('Youssef Khayat', 23, '포워드',
    '{"PTS":8.7,"REB":7.3,"AST":1,"STL":0.3,"BLK":0.3,"FG_PCT":43.5,"FG3M":0.7,"FG3_PCT":22.2,"FT_PCT":50.0}',
    '{"height_cm":205,"birthdate":"2003-03-11","club":"C.S. Sagesse"}'),
  ('Marc Khoueiry', 3, '가드',   -- 추정(신장 185cm 기준)
    '{"PTS":0,"REB":0,"AST":0,"STL":0,"BLK":0,"FG_PCT":0,"FG3M":0,"FG3_PCT":0,"FT_PCT":0}',
    '{"height_cm":185,"birthdate":"2001-08-21","club":"C.S. Sagesse"}'),
  ('Dedric Lawson', 11, '포워드',
    '{"PTS":14.3,"REB":12,"AST":3.3,"STL":0.7,"BLK":1,"FG_PCT":47.1,"FG3M":0.3,"FG3_PCT":9.1,"FT_PCT":71.4}',
    '{"height_cm":206,"birthdate":"1997-10-01","club":"Xinjiang Flying Tigers(중국 CBA)"}'),
  ('Ater Majok', 3, '센터',
    '{"PTS":6.3,"REB":6,"AST":0.7,"STL":0.3,"BLK":1.7,"FG_PCT":72.7,"FG3M":0,"FG3_PCT":0,"FT_PCT":75.0}',
    '{"height_cm":210,"birthdate":"1987-07-04","club":"Al Nawair"}'),
  ('Ali Mansour', 10, '가드',
    '{"PTS":6,"REB":3.5,"AST":4.5,"STL":2.5,"BLK":0,"FG_PCT":50.0,"FG3M":1,"FG3_PCT":100.0,"FT_PCT":0}',
    '{"height_cm":185,"birthdate":"1998-01-01","club":"Al Riyadi"}'),
  ('Ali Mezher', 25, '가드',
    '{"PTS":2.8,"REB":2.5,"AST":3.7,"STL":1.2,"BLK":0,"FG_PCT":36.8,"FG3M":0.3,"FG3_PCT":28.6,"FT_PCT":50.0}',
    '{"height_cm":182,"birthdate":"1994-03-22","club":"C.S. Sagesse"}'),
  ('Anthony Naba', 35, '포워드',
    '{"PTS":null,"REB":null,"AST":null,"STL":null,"BLK":null,"FG_PCT":null,"FG3M":null,"FG3_PCT":null,"FT_PCT":null}',
    '{"height_cm":201,"birthdate":"2006-04-15","club":"Central"}'),
  ('Lucas Saleh', 22, '포워드',   -- 추정(신장 202cm 기준)
    '{"PTS":0,"REB":0,"AST":0,"STL":0,"BLK":0,"FG_PCT":0,"FG3M":0,"FG3_PCT":0,"FT_PCT":0}',
    '{"height_cm":202,"birthdate":"2000-05-01","club":"Central"}'),
  ('Amir Saoud', 5, '가드',
    '{"PTS":9.7,"REB":2,"AST":3.5,"STL":0.5,"BLK":0,"FG_PCT":52.6,"FG3M":1,"FG3_PCT":37.5,"FT_PCT":92.3}',
    '{"height_cm":187,"birthdate":"1991-01-18","club":"Al Riyadi"}'),
  ('Karl Zamatta', 32, '포워드',   -- 추정(신장 200cm 기준)
    '{"PTS":2,"REB":0,"AST":0,"STL":0,"BLK":0,"FG_PCT":50.0,"FG3M":0,"FG3_PCT":0,"FT_PCT":0}',
    '{"height_cm":200,"birthdate":"2006-05-07","club":"DA Dijon 21(프랑스)"}'),
  ('Karim Zeinoun', 7, '가드',
    '{"PTS":9.2,"REB":1.6,"AST":1.6,"STL":0.4,"BLK":0,"FG_PCT":58.6,"FG3M":1.8,"FG3_PCT":60.0,"FT_PCT":75.0}',
    '{"height_cm":188,"birthdate":"1999-06-16","club":"Al Riyadi"}')
) as x(name, jersey, position, stats, bio)
where s.code = 'bball_nt';
