// Seed script for NBA sport (code 'nba', already exists with 0 teams/players/stat
// fields): Los Angeles Lakers 2025-26 roster, following the same pattern as
// scripts/seedBasketballNationalTeams.js — REST API via anon key (RLS disabled).
//
// Data sourced 2026-08-27: roster/height/birthdate from Wikipedia's
// "2025-26 Los Angeles Lakers season" article, per-game stats from ESPN's Lakers
// team stats page. Cross-checked both sources' player lists against each other and
// a general web search — ESPN's *roster* page (not the stats page) returned stale/
// wrong names (missing LeBron James entirely, included several players who are on
// other teams) so it was NOT used; only the roster names present in BOTH Wikipedia
// and the ESPN stats page were kept (17 players). Gabe Vincent/Kobe Bufkin/Christian
// Koloko appeared only in the ESPN stats page and searches suggested they're
// actually with other teams now, so they were excluded rather than guessed at.
//
// Usage:  node scripts/seedNbaLakers.js
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

// Same 9-field per-game-average model as bball_nt (농구 국가대표).
const STAT_FIELDS = [
  ['PTS', '득점', 1], ['REB', '리바운드', 2], ['AST', '어시스트', 3], ['STL', '스틸', 4],
  ['BLK', '블록', 5], ['FG_PCT', '야투%', 6], ['FG3M', '3점성공', 7], ['FG3_PCT', '3점%', 8],
  ['FT_PCT', '자유투%', 9],
];

// [name, jersey, position, stats, bio]
const LAKERS = [
  ['Luka Dončić', 77, '가드', { PTS: 33.5, REB: 7.7, AST: 8.3, STL: 1.6, BLK: 0.5, FG_PCT: 47.6, FG3M: 4.0, FG3_PCT: 36.6, FT_PCT: 78.0 }, { height_cm: 203, birthdate: '1999-02-28', school: 'Slovenia' }],
  ['Austin Reaves', 15, '가드', { PTS: 23.3, REB: 4.7, AST: 5.5, STL: 1.1, BLK: 0.4, FG_PCT: 49.0, FG3M: 2.3, FG3_PCT: 36.0, FT_PCT: 87.1 }, { height_cm: 196, birthdate: '1998-05-29', school: 'Oklahoma' }],
  ['LeBron James', 23, '포워드', { PTS: 20.9, REB: 6.1, AST: 7.2, STL: 1.2, BLK: 0.6, FG_PCT: 51.5, FG3M: 1.3, FG3_PCT: 31.7, FT_PCT: 73.7 }, { height_cm: 206, birthdate: '1984-12-30', school: 'St. Vincent-St. Mary HS (OH)' }],
  ['Deandre Ayton', 5, '센터', { PTS: 12.5, REB: 8.0, AST: 0.8, STL: 0.6, BLK: 1.0, FG_PCT: 67.1, FG3M: 0.0, FG3_PCT: 0.0, FT_PCT: 64.5 }, { height_cm: 213, birthdate: '1998-07-23', school: 'Arizona' }],
  ['Rui Hachimura', 28, '포워드', { PTS: 11.5, REB: 3.3, AST: 0.8, STL: 0.6, BLK: 0.3, FG_PCT: 51.4, FG3M: 1.7, FG3_PCT: 44.3, FT_PCT: 69.4 }, { height_cm: 203, birthdate: '1998-02-08', school: 'Gonzaga' }],
  ['Marcus Smart', 36, '가드', { PTS: 9.3, REB: 2.8, AST: 3.0, STL: 1.4, BLK: 0.4, FG_PCT: 39.5, FG3M: 1.6, FG3_PCT: 33.1, FT_PCT: 82.2 }, { height_cm: 191, birthdate: '1994-03-06', school: 'Oklahoma State' }],
  ['Luke Kennard', 10, '가드', { PTS: 9.0, REB: 2.6, AST: 2.4, STL: 0.7, BLK: 0.1, FG_PCT: 52.7, FG3M: 1.3, FG3_PCT: 44.8, FT_PCT: 91.2 }, { height_cm: 196, birthdate: '1996-06-24', school: 'Duke' }],
  ['Jake LaRavia', 12, '포워드', { PTS: 8.2, REB: 4.0, AST: 1.8, STL: 1.3, BLK: 0.5, FG_PCT: 45.9, FG3M: 1.0, FG3_PCT: 32.1, FT_PCT: 76.3 }, { height_cm: 201, birthdate: '2001-11-03', school: 'Wake Forest' }],
  ['Jaxson Hayes', 11, '센터', { PTS: 7.5, REB: 4.1, AST: 0.9, STL: 0.4, BLK: 0.8, FG_PCT: 75.6, FG3M: 0.0, FG3_PCT: 100.0, FT_PCT: 65.3 }, { height_cm: 213, birthdate: '2000-05-23', school: 'Texas' }],
  ['Nick Smith Jr.', 20, '가드', { PTS: 6.2, REB: 0.8, AST: 1.0, STL: 0.3, BLK: 0.1, FG_PCT: 43.5, FG3M: 1.1, FG3_PCT: 39.5, FT_PCT: 73.3 }, { height_cm: 188, birthdate: '2004-04-18', school: 'Arkansas' }],
  ['Jarred Vanderbilt', 2, '포워드', { PTS: 4.4, REB: 4.5, AST: 1.3, STL: 0.8, BLK: 0.3, FG_PCT: 47.1, FG3M: 0.4, FG3_PCT: 29.3, FT_PCT: 58.9 }, { height_cm: 203, birthdate: '1999-04-03', school: 'Kentucky' }],
  ['Dalton Knecht', 4, '가드', { PTS: 4.2, REB: 1.4, AST: 0.4, STL: 0.2, BLK: 0.2, FG_PCT: 45.5, FG3M: 0.7, FG3_PCT: 34.2, FT_PCT: 72.7 }, { height_cm: 198, birthdate: '2001-04-19', school: 'Tennessee' }],
  ['Drew Timme', 17, '포워드', { PTS: 3.4, REB: 1.2, AST: 0.9, STL: 0.2, BLK: 0.0, FG_PCT: 57.6, FG3M: 0.4, FG3_PCT: 44.0, FT_PCT: 55.6 }, { height_cm: 206, birthdate: '2000-09-09', school: 'Gonzaga' }],
  ['Bronny James', 9, '가드', { PTS: 2.9, REB: 0.5, AST: 1.2, STL: 0.5, BLK: 0.1, FG_PCT: 40.9, FG3M: 0.5, FG3_PCT: 38.6, FT_PCT: 85.7 }, { height_cm: 188, birthdate: '2004-10-06', school: 'USC' }],
  ['Maxi Kleber', 14, '포워드', { PTS: 1.9, REB: 1.1, AST: 0.4, STL: 0.3, BLK: 0.1, FG_PCT: 45.2, FG3M: 0.1, FG3_PCT: 23.1, FT_PCT: 53.8 }, { height_cm: 208, birthdate: '1992-01-29', school: 'Germany' }],
  ['Adou Thiero', 1, '포워드', { PTS: 0.8, REB: 0.5, AST: 0.3, STL: 0.6, BLK: 0.2, FG_PCT: 51.6, FG3M: 0.0, FG3_PCT: 33.3, FT_PCT: 63.6 }, { height_cm: 201, birthdate: '2004-05-08', school: 'Arkansas' }],
  ['Chris Mañon', 30, '가드', { PTS: 0.0, REB: 0.5, AST: 0.0, STL: 0.0, BLK: 0.0, FG_PCT: 33.3, FG3M: 0.0, FG3_PCT: 0.0, FT_PCT: 75.0 }, { height_cm: 193, birthdate: '2001-12-09', school: 'Vanderbilt' }],
];

async function getSportId() {
  const [sport] = await get('/rest/v1/sports?code=eq.nba&select=id');
  if (!sport) throw new Error('nba sport row not found');
  return sport.id;
}

async function upsertTeam(sportId, name, shortName, city) {
  const extra = { conference: 'Western', division: 'Pacific' };
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
  const sportId = await getSportId();
  console.log('sport ok', sportId);

  for (const [key, label, order] of STAT_FIELDS) {
    await post('/rest/v1/sport_stat_fields?on_conflict=sport_id,stat_key',
      { sport_id: sportId, stat_key: key, label, data_type: 'number', sort_order: order },
      { Prefer: 'resolution=merge-duplicates' });
  }
  console.log('stat fields ok');

  const lakersId = await upsertTeam(sportId, '로스앤젤레스 레이커스', '레이커스', 'Los Angeles');
  await seedRoster(sportId, lakersId, LAKERS);
  console.log('lakers roster ok (' + LAKERS.length + ')');
}

main().catch((e) => { console.error(e); process.exit(1); });
