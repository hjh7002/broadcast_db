// Creates 사우디아라비아 남자농구 국가대표팀 (bball_nt) — roster, coaching staff,
// group standings/news (shared F조 data), and 1·2라운드 schedule. Mirrors the
// Korea/Lebanon pattern (see scripts/seedBasketballNationalTeams.js,
// patchCoachingStaff.js, patchGroupFStandingsNews.js, patchKoreaSchedule.js).
//
// Roster is the user-supplied "training camp roster" (16 names), not the full
// accumulated-stats list — 11 have Round-1 stats already, 5 are new call-ups
// with no stats yet. Positions are inferred from height where not confirmed
// by a source (marked in comments) — lower confidence than Korea/Lebanon.
//
// Usage:  node scripts/seedSaudiArabia.js
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function req(method, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(extraHeaders || {}) };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(url, { method, headers }, (res) => {
      let d = ''; res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`${method} ${path} -> ${res.statusCode}: ${d}`));
        try { resolve(d ? JSON.parse(d) : null); } catch { resolve(d); }
      });
    });
    r.on('error', reject); if (payload) r.write(payload); r.end();
  });
}
const get = (path) => req('GET', path);
const patch = (path, body) => req('PATCH', path, body);
const post = (path, body, extraHeaders) => req('POST', path, body, extraHeaders);

const NA = { PTS: null, REB: null, AST: null, STL: null, BLK: null, FG_PCT: null, FG3M: null, FG3_PCT: null, FT_PCT: null };

const ROSTER = [
  ['Muhammad-Ali Abdur-Rahkman', 5, '가드', { PTS: 21.8, REB: 5.5, AST: 4.2, STL: 0.5, BLK: 0.2, FG_PCT: 44.0, FG3M: 3.2, FG3_PCT: 40.4, FT_PCT: 91.4 }, { height_cm: 193, birthdate: '1994-09-01', club: 'Universo Treviso Basket(이탈리아)' }],
  ['Mohammed Alsuwailem', 12, '센터', { PTS: 15.8, REB: 11.2, AST: 2.4, STL: 0.6, BLK: 2.2, FG_PCT: 77.8, FG3M: 0.2, FG3_PCT: 33.3, FT_PCT: 88.0 }, { height_cm: 208, birthdate: '1998-03-02', club: 'Alula' }],
  ['Khalid Abdel Gabar', 10, '가드', { PTS: 10.4, REB: 4.6, AST: 5.0, STL: 1.6, BLK: 0, FG_PCT: 36.7, FG3M: 1.6, FG3_PCT: 33.3, FT_PCT: 66.7 }, { height_cm: 183, birthdate: '1990-12-04', club: 'Alhilal' }],
  ['Marzouq Almuwallad', 0, '가드', { PTS: 12.7, REB: 3.0, AST: 2.3, STL: 1.7, BLK: 0.3, FG_PCT: 45.9, FG3M: 0, FG3_PCT: 0, FT_PCT: 100.0 }, { height_cm: 183, birthdate: '1992-08-06', club: 'Al Ahli' }],
  ['Musab Tariq M Kadi', 99, '포워드', { PTS: 9.0, REB: 2.3, AST: 1.2, STL: 2.5, BLK: 0.7, FG_PCT: 47.8, FG3M: 1.0, FG3_PCT: 28.6, FT_PCT: 33.3 }, { height_cm: 196, birthdate: '1999-08-11', club: 'Al Nasr Riyadh' }],
  ['Mathna Almarwani', 6, '포워드', { PTS: 10.4, REB: 4.6, AST: 1.6, STL: 0.6, BLK: 0, FG_PCT: 38.3, FG3M: 1.0, FG3_PCT: 26.3, FT_PCT: 68.8 }, { height_cm: 192, birthdate: '1992-01-01', club: 'Al Ittihad' }],
  ['Ali Shubayli', 20, '가드', { PTS: 4.2, REB: 3.0, AST: 0.5, STL: 0.7, BLK: 0, FG_PCT: 40.0, FG3M: 0.8, FG3_PCT: 41.7, FT_PCT: 0 }, { height_cm: 190, birthdate: '1996-01-18', club: 'Al Ahli' }],
  ['Fahad Belal', 8, '가드', { PTS: 2.0, REB: 2.0, AST: 3.0, STL: 1.0, BLK: 0, FG_PCT: 20.0, FG3M: 0.7, FG3_PCT: 20.0, FT_PCT: 0 }, { height_cm: 186, birthdate: '1991-04-30', club: 'Al Ahli' }],
  ['Osama Albargawi', 0, '가드', { PTS: 1.2, REB: 1.2, AST: 0.4, STL: 0.4, BLK: 0, FG_PCT: 27.3, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 188, birthdate: '1998-12-07', club: 'Al Ittihad' }],
  ['Thamer Mohammed', 35, '포워드', { PTS: 0.8, REB: 1.0, AST: 0.2, STL: 0.2, BLK: 0.4, FG_PCT: 40.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 195, birthdate: '1997-05-19', club: 'Al Ahli' }],
  ['Hani Almohammed', 15, '센터', { PTS: 0.7, REB: 0.3, AST: 0.7, STL: 0, BLK: 0, FG_PCT: 33.3, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 202, birthdate: '1989-10-15', club: 'Al Salam' }],
  // 신규 소집(이번 예선 출전 기록 없음)
  ['Mohammed Almarwani', null, '센터', NA, { height_cm: 206, birthdate: '1989-07-24', club: 'Al-Wehda' }],
  ['Ahmed Almukhtar', null, '가드', NA, { height_cm: 193, birthdate: '1993-02-19', club: 'Uhud Medina' }],
  ['Hammam Hussain', null, '센터', NA, { height_cm: 194, birthdate: '2002-02-24', club: '' }],
  ['Mohammed Alsaqer', null, '가드', NA, { height_cm: null, birthdate: '2000-10-05', club: '' }], // 신장 정보 없음, 포지션 추정 낮은 신뢰도
  ['Abdulaziz Alalawi', null, '포워드', NA, { height_cm: 183, birthdate: '', club: 'Al-Ula' }],
];

const GROUP_STANDINGS = [
  { rank: 1, code: 'LBN', name_ko: '레바논', wins: 5, losses: 1, points: 11 },
  { rank: 2, code: 'JPN', name_ko: '일본', wins: 4, losses: 2, points: 10 },
  { rank: 3, code: 'QAT', name_ko: '카타르', wins: 4, losses: 2, points: 10 },
  { rank: 4, code: 'KOR', name_ko: '한국', wins: 3, losses: 3, points: 9 },
  { rank: 5, code: 'CHN', name_ko: '중국', wins: 3, losses: 3, points: 9 },
  { rank: 6, code: 'KSA', name_ko: '사우디아라비아', wins: 3, losses: 3, points: 9 },
];

const SCHEDULE = [
  { round: '1라운드', opponent_code: 'IND', opponent_name: '인도', home: true, date: '2025-11-27', venue: 'Riyadh (사우디아라비아)', status: 'finished', score_for: 75, score_against: 51, result: 'W' },
  { round: '1라운드', opponent_code: 'IND', opponent_name: '인도', home: false, date: '2025-11-30', venue: 'Chennai (인도)', status: 'finished', score_for: 81, score_against: 57, result: 'W' },
  { round: '1라운드', opponent_code: 'LBN', opponent_name: '레바논', home: false, date: '2026-02-28', venue: 'Zouk Mikael (레바논)', status: 'finished', score_for: 64, score_against: 94, result: 'L' },
  { round: '1라운드', opponent_code: 'QAT', opponent_name: '카타르', home: false, date: '2026-06-29', venue: 'Doha (카타르)', status: 'finished', score_for: 86, score_against: 80, result: 'W' },
  { round: '1라운드', opponent_code: 'LBN', opponent_name: '레바논', home: true, date: '2026-07-03', venue: 'Jeddah (사우디아라비아)', status: 'finished', score_for: 82, score_against: 88, result: 'L' },
  { round: '1라운드', opponent_code: 'QAT', opponent_name: '카타르', home: true, date: '2026-07-06', venue: 'Jeddah (사우디아라비아)', status: 'finished', score_for: 73, score_against: 76, result: 'L' },
  { round: '2라운드', opponent_code: 'JPN', opponent_name: '일본', home: true, date: '2026-08-28', venue: 'Jeddah (사우디아라비아)', note: '한국시간 02:00', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'KOR', opponent_name: '한국', home: false, date: '2026-08-31', venue: '수원 (대한민국)', note: '시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'CHN', opponent_name: '중국', home: true, date: '2026-11-26', venue: '미정 (사우디아라비아)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'KOR', opponent_name: '한국', home: true, date: '2026-11-29', venue: '미정 (사우디아라비아)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'JPN', opponent_name: '일본', home: false, date: '2027-02-26', venue: '미정 (일본)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'CHN', opponent_name: '중국', home: false, date: '2027-03-01', venue: '미정 (중국)', note: '구장·시간 미정', status: 'scheduled' },
];

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const sportId = sport.id;

  await post('/rest/v1/teams?on_conflict=sport_id,name',
    { sport_id: sportId, name: '사우디아라비아 남자농구 국가대표팀', short_name: '사우디아라비아', city: 'Saudi Arabia',
      extra: { competition: 'FIBA Basketball World Cup 2027 Asian Qualifiers', group: 'F', coaching_staff: [{ role: '감독', name: '다니엘 마페이(Daniel Maffei)', since: 2026 }], group_standings: GROUP_STANDINGS, schedule: SCHEDULE } },
    { Prefer: 'resolution=merge-duplicates,return=representation' });
  const [team] = await get('/rest/v1/teams?sport_id=eq.' + sportId + '&name=eq.' + encodeURIComponent('사우디아라비아 남자농구 국가대표팀') + '&select=id');
  console.log('team ok', team.id);

  await req('DELETE', `/rest/v1/players?team_id=eq.${team.id}`);
  const rows = ROSTER.map(([name, jersey, position, stats, bio]) => ({ sport_id: sportId, team_id: team.id, name, jersey_number: jersey, position, stats, bio }));
  await post('/rest/v1/players', rows);
  console.log('roster ok (' + rows.length + ')');
}

main().catch((e) => { console.error(e); process.exit(1); });
