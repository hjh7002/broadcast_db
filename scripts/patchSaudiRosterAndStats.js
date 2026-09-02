// Refreshes Saudi Arabia: Hangulizes the current Window 4 12-man roster
// ("한글 English" format, matching Lebanon's convention), updates season
// stats for every player from FIBA's tournament-wide averages table, adds a
// few bench players who weren't in our DB yet, and sets final_roster_ids to
// the current 12-man call-up.
// Usage: node scripts/patchSaudiRosterAndStats.js
const https = require('https');
const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' };
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
const post = (path, body) => req('POST', path, body);

const TEAM_ID = 'ad84ff6f-4ff6-45c8-a7cf-ea717e7bd86a';
const SPORT_ID = '070fa9b9-a146-4a0f-9207-d87b86dcb54a';

// Window 4 12-man roster -> Hangul (English name kept as suffix, matching Lebanon's format)
const HANGUL_12 = {
  'Marzouq Almuwallad': '마르주크 알무왈라드',
  'Osama Albargawi': '오사마 알바르가위',
  'Abdulaziz Alalawi': '압둘아지즈 하산 알알라위', // DB has short form; FIBA roster shows "Abdulaziz Hassan Alalawi"
  'Muhammad-Ali Abdur-Rahkman': '무함마드알리 압두르라흐크만',
  'Mathna Almarwani': '마스나 알마르와니',
  'Mohammed Alsaqer': '모하메드 알사게르', // matches FIBA's "Mohammed Alsager"
  'Khalid Abdel Gabar': '칼리드 압델 가바르',
  'Mohammed Alsuwailem': '모하메드 알수와일렘',
  'Ahmed Almukhtar': '아흐메드 알무크타르',
  'Ali Shubayli': '알리 슈바일리',
  'Thamer Mohammed': '타메르 마흐무드 모하메드',
  'Hammam Hussain': '함맘 압둘카림 후세인',
};

// FIBA English name (as currently stored, or matched) -> season stat line
const STATS = {
  'Muhammad-Ali Abdur-Rahkman': { GP: 7, MIN: 34.4, PTS: 21, REB: 4.9, AST: 3.9, STL: 0.4, BLK: 0.1, FG3M: 3, FG_PCT: 43, FG3_PCT: 37.5, FT_PCT: 89.5, OREB: 0.9, TO: 2.1 },
  'Mohammed Alsuwailem': { GP: 6, MIN: 34, PTS: 16.3, REB: 12, AST: 3.2, STL: 0.5, BLK: 1.8, FG3M: 0.3, FG_PCT: 76.1, FG3_PCT: 40, FT_PCT: 89.7, OREB: 3, TO: 2.7 },
  'Khalid Abdel Gabar': { GP: 6, MIN: 32.8, PTS: 10.5, REB: 4.5, AST: 4.7, STL: 1.3, BLK: 0, FG3M: 1.3, FG_PCT: 37.9, FG3_PCT: 29.6, FT_PCT: 73.3, OREB: 1, TO: 2 },
  'Mathna Almarwani': { GP: 6, MIN: 24.6, PTS: 9.8, REB: 4.5, AST: 2.3, STL: 0.5, BLK: 0, FG3M: 1, FG_PCT: 38.9, FG3_PCT: 26.1, FT_PCT: 64.7, OREB: 1, TO: 2.2 },
  'Musab Tariq M Kadi': { GP: 6, MIN: 24.1, PTS: 9, REB: 2.3, AST: 1.2, STL: 2.5, BLK: 0.7, FG3M: 1, FG_PCT: 47.8, FG3_PCT: 28.6, FT_PCT: 33.3, OREB: 0.5, TO: 1.7 },
  'Ali Shubayli': { GP: 7, MIN: 22.8, PTS: 6, REB: 3.1, AST: 0.6, STL: 0.6, BLK: 0, FG3M: 1, FG_PCT: 48.6, FG3_PCT: 43.8, FT_PCT: 100, OREB: 0.9, TO: 1.3 },
  'Marzouq Almuwallad': { GP: 4, MIN: 22.3, PTS: 10.5, REB: 2.3, AST: 1.8, STL: 1.3, BLK: 0.3, FG3M: 0, FG_PCT: 45.2, FG3_PCT: 0, FT_PCT: 100, OREB: 1, TO: 1.8 },
  'Fahad Belal': { GP: 3, MIN: 16.8, PTS: 2, REB: 2, AST: 3, STL: 1, BLK: 0, FG3M: 0.7, FG_PCT: 20, FG3_PCT: 20, FT_PCT: null, OREB: 0.7, TO: 1.3 },
  'Osama Albargawi': { GP: 6, MIN: 8.7, PTS: 1.7, REB: 1.3, AST: 0.3, STL: 0.3, BLK: 0, FG3M: 0, FG_PCT: 33.3, FG3_PCT: 0, FT_PCT: null, OREB: 0.3, TO: 0.3 },
  'Thamer Mohammed': { GP: 6, MIN: 7.3, PTS: 0.7, REB: 0.8, AST: 0.2, STL: 0.2, BLK: 0.3, FG3M: 0, FG_PCT: 40, FG3_PCT: 0, FT_PCT: null, OREB: 0.5, TO: 0.8 },
  'Hani Almohammed': { GP: 3, MIN: 6, PTS: 0.7, REB: 0.3, AST: 0.7, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 33.3, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 0 },
  'Mohammed Alsaqer': { GP: 4, MIN: 1.3, PTS: 1, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: 66.7, OREB: 0, TO: 0 },
  'Ahmed Almukhtar': { GP: 0, MIN: 0, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 0 },
  'Abdulaziz Alalawi': { GP: 0, MIN: 0, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 0 },
  'Hammam Hussain': { GP: 1, MIN: 1.8, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 0 },
};

// New bench players not yet in our DB (not part of the 12-man roster; plain English names)
const NEW_PLAYERS = [
  { name: 'Mohammed Kadi', jersey_number: 32, position: '가드', stats: { GP: 3, MIN: 5.8, PTS: 1, REB: 2, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 20, FG3_PCT: 0, FT_PCT: 33.3, OREB: 0.7, TO: 0 } },
  { name: 'Manaf Alsalem', jersey_number: 24, position: '가드', stats: { GP: 4, MIN: 5.4, PTS: 1.3, REB: 0.8, AST: 0.5, STL: 0.5, BLK: 0, FG3M: 0.3, FG_PCT: 100, FG3_PCT: 100, FT_PCT: 100, OREB: 0.3, TO: 0.8 } },
  { name: 'Mubarki Abdulrahman', jersey_number: 2, position: '가드', stats: { GP: 1, MIN: 4.8, PTS: 0, REB: 1, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 2 } },
  { name: 'Mohammed Nader S Alkhater', jersey_number: 44, position: '포워드', stats: { GP: 1, MIN: 0.9, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 0 } },
  { name: 'Moayad Alsharif', jersey_number: 25, position: '가드', stats: { GP: 2, MIN: 0.5, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null, OREB: 0, TO: 0 } },
];

async function main() {
  const players = await get(`/rest/v1/players?team_id=eq.${TEAM_ID}&select=id,name,jersey_number,bio,stats`);

  // 1. Hangulize the 12-man roster + set jersey for the two renamed ones
  for (const [en, ko] of Object.entries(HANGUL_12)) {
    const p = players.find((x) => x.name === en);
    if (!p) { console.log('SKIP hangul (not found):', en); continue; }
    const newName = `${ko} ${en === 'Abdulaziz Alalawi' ? 'Abdulaziz Hassan Alalawi' : en === 'Mohammed Alsaqer' ? 'Mohammed Alsager' : en}`;
    await patch(`/rest/v1/players?id=eq.${p.id}`, { name: newName });
    console.log('hangulized', en, '->', newName);
  }

  // 2. Update season stats for everyone matched
  for (const [en, stat] of Object.entries(STATS)) {
    const p = players.find((x) => x.name === en);
    if (!p) { console.log('SKIP stats (not found):', en); continue; }
    const existingLog = (p.stats && p.stats.GAME_LOG) || [];
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: { ...stat, GAME_LOG: existingLog } });
    console.log('stats updated', en);
  }

  // 3. Add missing bench players
  for (const np of NEW_PLAYERS) {
    const exists = players.find((x) => x.name === np.name);
    if (exists) { console.log('already exists, skip add:', np.name); continue; }
    await post('/rest/v1/players', {
      sport_id: SPORT_ID, team_id: TEAM_ID, name: np.name,
      position: np.position, jersey_number: np.jersey_number, stats: np.stats, bio: {},
    });
    console.log('added new player', np.name);
  }

  // 4. Set final_roster_ids to the current 12-man Window 4 roster
  const refreshed = await get(`/rest/v1/players?team_id=eq.${TEAM_ID}&select=id,name`);
  const finalNames12 = [
    '마르주크 알무왈라드', '오사마 알바르가위', '압둘아지즈 하산 알알라위', '무함마드알리 압두르라흐크만',
    '마스나 알마르와니', '모하메드 알사게르', '칼리드 압델 가바르', '모하메드 알수와일렘',
    '아흐메드 알무크타르', '알리 슈바일리', '타메르 마흐무드 모하메드', '함맘 압둘카림 후세인',
  ];
  const finalIds = finalNames12
    .map((ko) => refreshed.find((p) => p.name.startsWith(ko))?.id)
    .filter(Boolean);
  console.log('final_roster_ids matched:', finalIds.length, '/ 12');

  const [team] = await get(`/rest/v1/teams?id=eq.${TEAM_ID}&select=extra`);
  await patch(`/rest/v1/teams?id=eq.${TEAM_ID}`, { extra: { ...team.extra, final_roster_ids: finalIds } });
  console.log('final_roster_ids saved on team');
}

main().catch((e) => { console.error(e); process.exit(1); });
