// Adds players.stats.GAME_LOG for Qatar's 5 most prominent Round 1 players
// (Brandon Goodwin, Alen Hadzibegovic, Abdulrahman Mohamed Saad, Moustafa
// Fouda, Donte Grantham) across all 6 finished Round 1 games each appeared
// in. Every row transcribed directly from fiba.basketball's live box-score
// tab (per-game totals cross-checked against FIBA's own cumulative stat
// page for each player — all matched exactly, see scripts/seedQatar.js
// header comment for sourcing notes).
//
// Usage:  node scripts/patchQatarGameLogs.js
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

// row(opp, date, MIN, PTS, FGM, FGA, P2M, P2A, P3M, P3A, FTM, FTA, OREB, DREB, REB, AST, PF, TO, STL, BLK, PM, EFF)
function row(opp, date, MIN, PTS, FGM, FGA, P2M, P2A, P3M, P3A, FTM, FTA, OREB, DREB, REB, AST, PF, TO, STL, BLK, PM, EFF) {
  const pct = (m, a) => (a > 0 ? Math.round((m / a) * 1000) / 10 : null);
  return {
    opp, date, rd: 'First Round', MIN, PTS,
    FGM, FGA, FGP: pct(FGM, FGA),
    P2M, P2A, P2P: pct(P2M, P2A),
    P3M, P3A, P3P: pct(P3M, P3A),
    FTM, FTA, FTP: pct(FTM, FTA),
    OREB, DREB, REB, AST, PF, TO, STL, BLK, PM, EFF,
  };
}

const GAME_LOGS = {
  'Brandon Goodwin': [
    row('LBN', '2025-11-28', 35, 17, 5, 14, 3, 8, 2, 6, 5, 8, 1, 5, 6, 7, 1, 5, 1, 1, -2, 15),
    row('LBN', '2025-12-01', 37, 25, 9, 15, 7, 9, 2, 6, 5, 8, 1, 7, 8, 8, 1, 0, 2, 0, 7, 34),
    row('IND', '2026-02-27', 20, 23, 8, 12, 3, 5, 5, 7, 2, 6, 1, 4, 5, 3, 2, 2, 2, 0, 16, 23),
  ],
  'Alen Hadzibegovic': [
    row('LBN', '2025-11-28', 26, 19, 7, 17, 5, 13, 2, 4, 3, 4, 6, 4, 10, 3, 3, 2, 4, 1, 6, 24),
    row('LBN', '2025-12-01', 32, 14, 4, 10, 1, 4, 3, 6, 3, 6, 3, 9, 12, 4, 1, 2, 2, 2, 11, 23),
    row('IND', '2026-02-27', 19, 4, 2, 10, 2, 9, 0, 1, 0, 2, 2, 4, 6, 1, 2, 0, 1, 1, 13, 3),
    row('KSA', '2026-06-29', 29, 25, 10, 16, 7, 10, 3, 6, 2, 4, 1, 7, 8, 0, 2, 1, 5, 4, -4, 33),
    row('KSA', '2026-07-06', 31, 21, 6, 10, 5, 8, 1, 2, 8, 11, 3, 4, 7, 2, 1, 3, 2, 1, 13, 23),
  ],
  'Abdulrahman Mohamed Saad': [
    row('LBN', '2025-11-28', 22, 9, 3, 9, 2, 7, 1, 2, 2, 3, 1, 4, 5, 2, 2, 2, 1, 0, 1, 8),
    row('LBN', '2025-12-01', 27, 20, 8, 11, 4, 6, 4, 5, 0, 0, 2, 2, 4, 4, 2, 0, 0, 0, 4, 25),
    row('IND', '2026-02-27', 19, 7, 3, 6, 2, 4, 1, 2, 0, 0, 0, 5, 5, 2, 1, 1, 0, 0, 24, 10),
    row('KSA', '2026-06-29', 35, 17, 7, 15, 5, 9, 2, 6, 1, 2, 2, 2, 4, 4, 2, 0, 0, 1, 3, 17),
    row('IND', '2026-07-02', 29, 24, 11, 25, 10, 20, 1, 5, 1, 4, 1, 5, 6, 3, 0, 1, 0, 0, 8, 15),
    row('KSA', '2026-07-06', 38, 12, 5, 12, 3, 4, 2, 8, 0, 0, 1, 2, 3, 5, 4, 3, 2, 1, 5, 13),
  ],
  'Moustafa Fouda': [
    row('LBN', '2025-11-28', 31, 5, 1, 7, 1, 2, 0, 5, 3, 4, 0, 3, 3, 3, 3, 3, 0, 0, 16, 1),
    row('LBN', '2025-12-01', 22, 6, 1, 7, 0, 0, 1, 7, 3, 5, 0, 1, 1, 3, 3, 0, 0, 0, -11, 2),
    row('IND', '2026-02-27', 24, 7, 2, 4, 1, 1, 1, 3, 2, 2, 1, 0, 1, 5, 2, 2, 2, 0, 23, 11),
    row('KSA', '2026-06-29', 38, 8, 3, 11, 3, 4, 0, 7, 2, 3, 0, 0, 0, 6, 3, 1, 0, 0, -2, 4),
    row('IND', '2026-07-02', 28, 17, 4, 9, 3, 6, 1, 3, 8, 8, 0, 3, 3, 1, 1, 0, 1, 0, 6, 17),
    row('KSA', '2026-07-06', 36, 10, 4, 11, 2, 4, 2, 7, 0, 0, 0, 2, 2, 8, 1, 0, 3, 0, 2, 16),
  ],
  'Donte Grantham': [
    row('KSA', '2026-06-29', 26, 14, 4, 7, 2, 4, 2, 3, 4, 4, 3, 1, 4, 1, 1, 3, 2, 0, 8, 15),
    row('IND', '2026-07-02', 20, 7, 2, 9, 2, 7, 0, 2, 3, 5, 4, 3, 7, 0, 1, 2, 0, 0, -5, 3),
    row('KSA', '2026-07-06', 28, 11, 4, 7, 3, 4, 1, 3, 2, 4, 4, 5, 9, 1, 3, 2, 0, 0, 4, 14),
  ],
};

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const sportId = sport.id;
  const [team] = await get('/rest/v1/teams?sport_id=eq.' + sportId + '&name=eq.' + encodeURIComponent('카타르 남자농구 국가대표팀') + '&select=id');
  if (!team) throw new Error('Qatar team not found — run seedQatar.js first');

  for (const [name, log] of Object.entries(GAME_LOGS)) {
    const [player] = await get(`/rest/v1/players?team_id=eq.${team.id}&name=eq.${encodeURIComponent(name)}&select=id,stats`);
    if (!player) { console.warn('player not found, skipping:', name); continue; }
    const newStats = { ...player.stats, GAME_LOG: log };
    await patch(`/rest/v1/players?id=eq.${player.id}`, { stats: newStats });
    console.log('game log ok:', name, '(' + log.length + ' games)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
