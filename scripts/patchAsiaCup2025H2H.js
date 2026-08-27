// Adds the 2025 FIBA Asia Cup Korea 97-86 Lebanon head-to-head box score to
// GAME_LOG for every player who (a) appeared in that specific box score and
// (b) is in our current DB, tagged rd: "2025 아시아컵" so it's distinguishable
// from qualifier/exhibition games and can be surfaced as a dedicated
// "직전 맞대결" entry regardless of chronological recency.
// Usage: node scripts/patchAsiaCup2025H2H.js
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

const DATE = '2025-08-11';
const RD = '2025 아시아컵';

function row(opp, MIN, PTS, p3, p2, ft, OREB, DREB, AST, PF, TO, STL, BLK, PM, EFF) {
  const FGM = p3[0] + p2[0], FGA = p3[1] + p2[1];
  const pct = (m, a) => (a ? Math.round((m / a) * 1000) / 10 : null);
  return {
    opp, date: DATE, rd: RD, MIN,
    PTS, FGM, FGA, FGP: pct(FGM, FGA),
    P2M: p2[0], P2A: p2[1], P2P: pct(p2[0], p2[1]),
    P3M: p3[0], P3A: p3[1], P3P: pct(p3[0], p3[1]),
    FTM: ft[0], FTA: ft[1], FTP: pct(ft[0], ft[1]),
    OREB, DREB, REB: OREB + DREB, AST, PF, TO, STL, BLK, PM, EFF,
  };
}

// Korea players (vs LBN) — only those in our current 12-man DB
const KOREA = {
  '이현중': row('LBN', 34, 28, [7, 13], [2, 2], [3, 3], 0, 6, 4, 1, 1, 1, 1, 14, 33),
  '유기상': row('LBN', 29, 28, [8, 12], [2, 4], [0, 0], 2, 0, 1, 1, 2, 3, 0, 21, 26),
  '이우석': row('LBN', 13, 3, [1, 2], [0, 0], [0, 0], 0, 0, 2, 2, 2, 0, 0, -12, 3),
  '이승현': row('LBN', 25, 9, [1, 3], [3, 5], [0, 0], 0, 4, 5, 4, 2, 0, 0, -4, 12),
};

// Lebanon players (vs KOR) — matched to our 24-man DB
const LEBANON = {
  '오마르 자말레딘': row('KOR', 22, 15, [2, 2], [4, 8], [1, 1], 1, 5, 1, 3, 2, 0, 0, -4, 17),
  '아미르 사우드': row('KOR', 19, 10, [2, 4], [2, 4], [0, 0], 0, 1, 4, 0, 2, 0, 0, -10, 9),
  '카림 제이눈': row('KOR', 20, 2, [0, 2], [1, 2], [0, 0], 0, 2, 4, 2, 0, 3, 0, -8, 8),
  '세르지오 엘다르위시': row('KOR', 14, 13, [2, 2], [3, 5], [1, 1], 1, 1, 3, 1, 2, 0, 0, 7, 14),
  '알리 만수르': row('KOR', 30, 12, [0, 0], [6, 8], [0, 0], 2, 3, 3, 4, 2, 1, 0, -6, 17),
  '디드릭 로슨': row('KOR', 19, 7, [0, 0], [3, 7], [1, 2], 3, 3, 0, 1, 2, 1, 0, -9, 7),
  '유세프 카얏': row('KOR', 31, 9, [1, 3], [3, 4], [0, 0], 0, 3, 3, 2, 0, 0, 1, -14, 13),
  '하이크 교크치안': row('KOR', 19, 4, [0, 2], [2, 5], [0, 0], 2, 0, 3, 1, 0, 0, 1, -12, 5),
  '제라르 하디디안': row('KOR', 6, 0, [0, 0], [0, 1], [0, 0], 0, 0, 0, 0, 0, 0, 0, -6, -1),
  '알리 하이다르': row('KOR', 20, 14, [0, 1], [5, 9], [4, 5], 3, 4, 2, 4, 2, 1, 0, -1, 15),
};

async function patchTeam(teamId, map) {
  const players = await get(`/rest/v1/players?team_id=eq.${teamId}&select=id,name,stats`);
  for (const [name, entry] of Object.entries(map)) {
    const p = players.find((x) => x.name === name || x.name.startsWith(name));
    if (!p) { console.log('SKIP (not found):', name); continue; }
    const log = (p.stats && p.stats.GAME_LOG) || [];
    if (log.some((g) => g.rd === RD)) { console.log('already has 2025 아시아컵 entry:', name); continue; }
    const merged = { ...p.stats, GAME_LOG: [entry, ...log] }; // prepend — chronologically earliest
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: merged });
    console.log('patched', name);
  }
}

async function main() {
  await patchTeam('d0232f50-b48b-4e82-9602-9d740c6ad4ce', KOREA); // Korea
  await patchTeam('2e5c9f10-816c-4bb8-bf7a-b5b4d95df61f', LEBANON); // Lebanon
}
main().catch((e) => { console.error(e); process.exit(1); });
