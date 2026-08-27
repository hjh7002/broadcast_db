// Corrects the Lakers roster after discovering it was accidentally built from
// stale 2025-26 season data (LeBron James left as a free agent to Philadelphia in
// July 2026, along with several others — see the Wikipedia "2026-27 Los Angeles
// Lakers season" article, updated July 22 2026, cross-referenced against its
// individually-cited Transactions table).
//
// Root cause of the original mistake: ESPN's *roster* page was actually showing the
// correct current (2026-27) roster all along; it was wrongly discarded as
// "unreliable" because it didn't match ESPN's *stats* page, which was showing
// LAST season's (2025-26) stat leaders — a different, expired season, not a data
// error. Lesson: a roster page and a stats page can legitimately disagree if the
// stats page hasn't rolled over to the new season yet.
//
// This script only removes departed players and adds new arrivals — the 8 players
// who are still on the team keep their existing `stats` (Dončić's row in particular
// already has the season-history/game-log/splits data from enrichNbaPlayerAdvanced.js;
// deleting and re-inserting would lose that, so those rows are left untouched).
// New arrivals get no `stats` yet since the 2026-27 season hasn't started (0-0 per
// Wikipedia's game log) — they have no Lakers stats to show.
//
// Usage: node scripts/fixLakersRoster2026_27.js
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
const patch = (path, body, extraHeaders) => req('PATCH', path, body, extraHeaders);

const DEPARTED = [
  'LeBron James', 'Deandre Ayton', 'Rui Hachimura', 'Marcus Smart',
  'Luke Kennard', 'Jaxson Hayes', 'Drew Timme', 'Nick Smith Jr.', 'Maxi Kleber',
];

// [name, jersey, position, height_cm, birthdate, school]
const NEW_ARRIVALS = [
  ['Cameron Carr', 43, '가드', 196, '2004-11-21', 'Baylor'],
  ['Quentin Grimes', 5, '가드', 193, '2000-05-08', 'Houston'],
  ['Jaden Hardy', 7, '가드', 191, '2002-07-05', 'Coronado HS (NV)'],
  ['Arthur Kaluma', 47, '포워드', 201, '2002-03-01', 'Texas'],
  ['Walker Kessler', 14, '센터', 218, '2001-07-26', 'Auburn'],
  ['Kevon Looney', 55, '센터', 206, '1996-02-06', 'UCLA'],
  ['Sandro Mamukelashvili', 54, '포워드', 206, '1999-05-23', 'Seton Hall'],
  ['AK Okereke', 31, '포워드', 201, '2003-07-02', 'Vanderbilt'],
  ['Collin Sexton', 10, '가드', 191, '1999-01-04', 'Alabama'],
  ['Matisse Thybulle', 26, '가드', 196, '1997-03-04', 'Washington'],
  ['Ziaire Williams', 11, '포워드', 206, '2001-09-12', 'Stanford'],
];

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.nba&select=id');
  const [team] = await get(`/rest/v1/teams?sport_id=eq.${sport.id}&name=eq.${encodeURIComponent('로스앤젤레스 레이커스')}&select=id`);
  const teamId = team.id;

  for (const name of DEPARTED) {
    await req('DELETE', `/rest/v1/players?team_id=eq.${teamId}&name=eq.${encodeURIComponent(name)}`, undefined, { Prefer: 'return=minimal' });
    console.log('removed', name);
  }

  const rows = NEW_ARRIVALS.map(([name, jersey, position, height_cm, birthdate, school]) => ({
    sport_id: sport.id,
    team_id: teamId,
    name,
    jersey_number: jersey,
    position,
    stats: {},
    bio: { height_cm, birthdate, school },
  }));
  await post('/rest/v1/players', rows);
  console.log('added', rows.length, 'new players');

  const [remaining] = await get(`/rest/v1/players?team_id=eq.${teamId}&select=id&order=jersey_number`).then((r) => [r.length]);
  console.log('final roster size:', remaining);
}

main().catch((e) => { console.error(e); process.exit(1); });
