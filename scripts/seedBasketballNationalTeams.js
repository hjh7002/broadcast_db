// One-off seed script for the "농구 국가대표" (basketball national team) sport:
// 대한민국 12인 + 레바논 24인 roster, replacing supabase/basketball_national_team.sql
// and supabase/basketball_lebanon.sql — run this directly instead of pasting SQL
// into the Supabase SQL Editor. RLS is disabled on every table (see
// lib/supabase/server.ts), so the anon key can read/write everything via REST.
//
// Usage:  node scripts/seedBasketballNationalTeams.js
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function req(method, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(extraHeaders || {}),
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(url, { method, headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`${method} ${path} -> ${res.statusCode}: ${d}`));
        try { resolve(d ? JSON.parse(d) : null); } catch { resolve(d); }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}
const get = (path) => req('GET', path);
const post = (path, body, extraHeaders) => req('POST', path, body, extraHeaders);
const del = (path) => req('DELETE', path, undefined, { Prefer: 'return=minimal' });

const STAT_FIELDS = [
  ['PTS', '득점', 1], ['REB', '리바운드', 2], ['AST', '어시스트', 3], ['STL', '스틸', 4],
  ['BLK', '블록', 5], ['FG_PCT', '야투%', 6], ['FG3M', '3점성공', 7], ['FG3_PCT', '3점%', 8],
  ['FT_PCT', '자유투%', 9],
];

const KOREA = [
  ['이현중', 1, '포워드', { PTS: 24.8, REB: 9.8, AST: 1.5, STL: 1.8, BLK: 0, FG_PCT: 50.0, FG3M: 4.8, FG3_PCT: 44.2, FT_PCT: 88.9 }, { height_cm: 200, birthdate: '2000-10-23', club: '나가사키 벨카(일본 B리그)' }],
  ['여준석', 22, '포워드', { PTS: 11.5, REB: 8.0, AST: 0.5, STL: 0, BLK: 0.5, FG_PCT: 47.8, FG3M: 0, FG3_PCT: 0, FT_PCT: 50.0 }, { height_cm: 202, birthdate: '2002-03-19', club: '시애틀대학교(NCAA)' }],
  ['이승현', 33, '포워드', { PTS: 4.7, REB: 4.7, AST: 2.8, STL: 0.7, BLK: 0.3, FG_PCT: 35.1, FG3M: 0, FG3_PCT: 0, FT_PCT: 50.0 }, { height_cm: 197, birthdate: '1992-04-16', club: '울산 현대모비스' }],
  ['이정현', 6, '가드', { PTS: 13.0, REB: 1.2, AST: 5.2, STL: 0.4, BLK: 0, FG_PCT: 44.2, FG3M: 2.8, FG3_PCT: 42.4, FT_PCT: 83.3 }, { height_cm: 190, birthdate: '1999-04-14', club: '고양 소노' }],
  ['안영준', 8, '포워드', { PTS: 8.5, REB: 5.3, AST: 1.0, STL: 1.3, BLK: 0.8, FG_PCT: 42.3, FG3M: 1.0, FG3_PCT: 36.4, FT_PCT: 61.5 }, { height_cm: 195, birthdate: '1995-06-28', club: '서울 SK' }],
  ['이우석', 11, '포워드', { PTS: 8.5, REB: 3.8, AST: 2.3, STL: 1.0, BLK: 0, FG_PCT: 40.6, FG3M: 0.8, FG3_PCT: 20.0, FT_PCT: 55.6 }, { height_cm: 196, birthdate: '1999-07-10', club: '상무' }],
  ['장재석', 31, '센터', { PTS: 9.5, REB: 6.5, AST: 1.0, STL: 0, BLK: 0, FG_PCT: 47.1, FG3M: 0, FG3_PCT: 0, FT_PCT: 50.0 }, { height_cm: 203, birthdate: '1991-02-03', club: '부산 KCC' }],
  ['유기상', 7, '가드', { PTS: 9.8, REB: 1.3, AST: 0.5, STL: 0.5, BLK: 0, FG_PCT: 35.3, FG3M: 1.8, FG3_PCT: 26.9, FT_PCT: 88.9 }, { height_cm: 188, birthdate: '2001-04-17', club: '창원 LG' }],
  ['변준형', 5, '가드', { PTS: 4.3, REB: 2.0, AST: 4.3, STL: 0.8, BLK: 0, FG_PCT: 41.2, FG3M: 0.8, FG3_PCT: 37.5, FT_PCT: 0 }, { height_cm: 186, birthdate: '1996-03-11', club: '안양 정관장' }],
  ['에디 다니엘', 36, '포워드', { PTS: 4.8, REB: 2.5, AST: 0.3, STL: 2.0, BLK: 0.3, FG_PCT: 70.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 83.3 }, { height_cm: 189, birthdate: '2007-04-03', club: '서울 SK' }],
  ['문유현', 24, '가드', { PTS: 4.0, REB: 0.3, AST: 2.0, STL: 1.7, BLK: 0, FG_PCT: 35.7, FG3M: 0.3, FG3_PCT: 25.0, FT_PCT: 50.0 }, { height_cm: 189, birthdate: '2004-06-08', club: '안양 정관장' }],
  ['이원석', 23, '센터', { PTS: 4.0, REB: 0.7, AST: 0.3, STL: 0, BLK: 1.3, FG_PCT: 60.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 100.0 }, { height_cm: 203, birthdate: '2000-01-30', club: '서울 삼성(2026 상무 입대)' }],
];

const NA = { PTS: null, REB: null, AST: null, STL: null, BLK: null, FG_PCT: null, FG3M: null, FG3_PCT: null, FT_PCT: null };

const LEBANON = [
  ['Joseph Abou Samra', 6, '가드', { PTS: 2, REB: 0, AST: 1, STL: 0, BLK: 0, FG_PCT: 33.3, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 193, birthdate: '2004-05-20', club: 'Beirut Club' }],
  ['Mark Alkhoury', 0, '포워드', { PTS: 6.3, REB: 4, AST: 1, STL: 0.7, BLK: 0, FG_PCT: 60.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 50.0 }, { height_cm: 196, birthdate: '1998-02-22', club: 'Antonine' }],
  ['Wael Arakji', 20, '가드', { PTS: 19.3, REB: 4.3, AST: 5, STL: 0.7, BLK: 0, FG_PCT: 51.3, FG3M: 1, FG3_PCT: 27.3, FT_PCT: 83.3 }, { height_cm: 193, birthdate: '1994-09-04', club: 'Al Riyadi' }],
  ['Sergio El Darwich', 9, '가드', { PTS: 13.6, REB: 5, AST: 4.6, STL: 1.4, BLK: 0.4, FG_PCT: 50.0, FG3M: 1, FG3_PCT: 38.5, FT_PCT: 70.8 }, { height_cm: 194, birthdate: '1996-07-25', club: 'Sendai 89ers(일본 B리그)' }],
  ['Omar El Jamal', 18, '포워드', NA, { height_cm: 203, birthdate: '2003-09-18', club: 'Hoops Club' }],
  ['Jihad Elkhatib', 15, '포워드', { PTS: 11.6, REB: 2.8, AST: 0.6, STL: 0.8, BLK: 0.2, FG_PCT: 55.0, FG3M: 1.4, FG3_PCT: 46.7, FT_PCT: 77.8 }, { height_cm: 203, birthdate: '2005-08-24', club: 'Central' }],
  ['Karim Ezzedine', null, '센터', NA, { height_cm: 206, birthdate: '1997-08-08', club: 'Al Markaziyyah Jounieh' }],
  ['DJ Funderburk', null, '센터', NA, { height_cm: 208, birthdate: '1997-04-12', club: 'Anwil Włocławek(폴란드)' }],
  ['Hayk Gyokchyan', 24, '포워드', { PTS: 8.7, REB: 4, AST: 2, STL: 0.7, BLK: 1.3, FG_PCT: 52.6, FG3M: 2, FG3_PCT: 54.5, FT_PCT: 0 }, { height_cm: 203, birthdate: '1989-12-11', club: 'Al Riyadi' }],
  ['Gerard Hadidian', 34, '센터', { PTS: 8.7, REB: 3.5, AST: 0.7, STL: 0.5, BLK: 0.7, FG_PCT: 57.6, FG3M: 0.2, FG3_PCT: 100.0, FT_PCT: 86.7 }, { height_cm: 202, birthdate: '1995-04-21', club: 'C.S. Sagesse' }],
  ['Ali Haidar', 40, '포워드', { PTS: 5, REB: 3, AST: 0, STL: 0, BLK: 0, FG_PCT: 27.3, FG3M: 0, FG3_PCT: 0, FT_PCT: 66.7 }, { height_cm: 206, birthdate: '1990-07-20', club: 'C.S. Sagesse' }],
  ['Omar Jamaleddine', 1, '포워드', { PTS: 6, REB: 4.3, AST: 2.7, STL: 1.7, BLK: 0, FG_PCT: 29.2, FG3M: 0.7, FG3_PCT: 18.2, FT_PCT: 50.0 }, { height_cm: 192, birthdate: '2000-06-13', club: 'Kawasaki Brave Thunders(일본 B리그)' }],
  ['Jad Khalil', 8, '가드', { PTS: 3, REB: 4, AST: 1, STL: 1, BLK: 0, FG_PCT: 33.3, FG3M: 0, FG3_PCT: 0, FT_PCT: 33.3 }, { height_cm: 185, birthdate: '1996-11-20', club: 'C.S. Sagesse' }],
  ['Youssef Khayat', 23, '포워드', { PTS: 8.7, REB: 7.3, AST: 1, STL: 0.3, BLK: 0.3, FG_PCT: 43.5, FG3M: 0.7, FG3_PCT: 22.2, FT_PCT: 50.0 }, { height_cm: 205, birthdate: '2003-03-11', club: 'C.S. Sagesse' }],
  ['Marc Khoueiry', 3, '가드', { PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG_PCT: 0, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 185, birthdate: '2001-08-21', club: 'C.S. Sagesse' }],
  ['Dedric Lawson', 11, '포워드', { PTS: 14.3, REB: 12, AST: 3.3, STL: 0.7, BLK: 1, FG_PCT: 47.1, FG3M: 0.3, FG3_PCT: 9.1, FT_PCT: 71.4 }, { height_cm: 206, birthdate: '1997-10-01', club: 'Xinjiang Flying Tigers(중국 CBA)' }],
  ['Ater Majok', 3, '센터', { PTS: 6.3, REB: 6, AST: 0.7, STL: 0.3, BLK: 1.7, FG_PCT: 72.7, FG3M: 0, FG3_PCT: 0, FT_PCT: 75.0 }, { height_cm: 210, birthdate: '1987-07-04', club: 'Al Nawair' }],
  ['Ali Mansour', 10, '가드', { PTS: 6, REB: 3.5, AST: 4.5, STL: 2.5, BLK: 0, FG_PCT: 50.0, FG3M: 1, FG3_PCT: 100.0, FT_PCT: 0 }, { height_cm: 185, birthdate: '1998-01-01', club: 'Al Riyadi' }],
  ['Ali Mezher', 25, '가드', { PTS: 2.8, REB: 2.5, AST: 3.7, STL: 1.2, BLK: 0, FG_PCT: 36.8, FG3M: 0.3, FG3_PCT: 28.6, FT_PCT: 50.0 }, { height_cm: 182, birthdate: '1994-03-22', club: 'C.S. Sagesse' }],
  ['Anthony Naba', 35, '포워드', NA, { height_cm: 201, birthdate: '2006-04-15', club: 'Central' }],
  ['Lucas Saleh', 22, '포워드', { PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG_PCT: 0, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 202, birthdate: '2000-05-01', club: 'Central' }],
  ['Amir Saoud', 5, '가드', { PTS: 9.7, REB: 2, AST: 3.5, STL: 0.5, BLK: 0, FG_PCT: 52.6, FG3M: 1, FG3_PCT: 37.5, FT_PCT: 92.3 }, { height_cm: 187, birthdate: '1991-01-18', club: 'Al Riyadi' }],
  ['Karl Zamatta', 32, '포워드', { PTS: 2, REB: 0, AST: 0, STL: 0, BLK: 0, FG_PCT: 50.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 200, birthdate: '2006-05-07', club: 'DA Dijon 21(프랑스)' }],
  ['Karim Zeinoun', 7, '가드', { PTS: 9.2, REB: 1.6, AST: 1.6, STL: 0.4, BLK: 0, FG_PCT: 58.6, FG3M: 1.8, FG3_PCT: 60.0, FT_PCT: 75.0 }, { height_cm: 188, birthdate: '1999-06-16', club: 'Al Riyadi' }],
];

async function upsertSport() {
  await post('/rest/v1/sports?on_conflict=code', { code: 'bball_nt', name: '농구 국가대표' }, { Prefer: 'resolution=merge-duplicates,return=representation' });
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  return sport.id;
}

async function upsertTeam(sportId, name, shortName, city, group) {
  const extra = { competition: 'FIBA Basketball World Cup 2027 Asian Qualifiers', group };
  await post('/rest/v1/teams?on_conflict=sport_id,name', { sport_id: sportId, name, short_name: shortName, city, extra }, { Prefer: 'resolution=merge-duplicates,return=representation' });
  const [team] = await get(`/rest/v1/teams?sport_id=eq.${sportId}&name=eq.${encodeURIComponent(name)}&select=id`);
  return team.id;
}

async function seedRoster(sportId, teamId, roster) {
  await del(`/rest/v1/players?team_id=eq.${teamId}`);
  const rows = roster.map(([name, jersey, position, stats, bio]) => ({
    sport_id: sportId, team_id: teamId, name, jersey_number: jersey, position, stats, bio,
  }));
  await post('/rest/v1/players', rows);
}

async function main() {
  const sportId = await upsertSport();
  console.log('sport ok', sportId);

  for (const [key, label, order] of STAT_FIELDS) {
    await post('/rest/v1/sport_stat_fields?on_conflict=sport_id,stat_key',
      { sport_id: sportId, stat_key: key, label, data_type: 'number', sort_order: order },
      { Prefer: 'resolution=merge-duplicates' });
  }
  console.log('stat fields ok');

  const koreaId = await upsertTeam(sportId, '대한민국 남자농구 국가대표팀', '대한민국', 'Korea', 'F');
  await seedRoster(sportId, koreaId, KOREA);
  console.log('korea roster ok (' + KOREA.length + ')');

  const lebanonId = await upsertTeam(sportId, '레바논 남자농구 국가대표팀', '레바논', 'Lebanon', 'F');
  await seedRoster(sportId, lebanonId, LEBANON);
  console.log('lebanon roster ok (' + LEBANON.length + ')');
}

main().catch((e) => { console.error(e); process.exit(1); });
