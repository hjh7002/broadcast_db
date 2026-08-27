// Adds per-game GAME_LOG (Round-1's 6 finished games) to 12 of 중국's 16 players —
// the ones whose per-game box lines were confirmed from FIBA player-profile pages
// (MIN/PTS/FG/3PT/FT/REB/AST/STL/BLK), cross-checked against independent FIBA/CGTN
// news recaps (e.g. Zhu Junlong 19pts/5x3PT vs TPE, Zhao Jiwei 17pts/6ast/5x3PT vs
// TPE, Hu Jinqiu 20pts/12reb vs JPN all matched exactly). The 4 skipped players
// (Pang Zhenglin/Wang Junjie/Li Hongquan/Cui Yongxi) are new window-4 call-ups with
// no round-1 appearances.
//
// OREB/DREB/PF/TO/PM are set to null — FIBA's game-boxscore pages didn't reliably
// expose those splits via automated fetch, unlike the fields above. EFF is computed
// as a simplified PTS+REB+AST+STL+BLK-(FGA-FGM)-(FTA-FTM) proxy (no turnover term),
// same caveat as the schedule's best_performer EFF values.
//
// Usage:  node scripts/patchChinaGameLogs.js [player name to test one]
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

const rd = 'First Round';
const round1 = { round: '1라운드' };

// Raw box lines: [opp, date, MIN, PTS, FGM, FGA, P3M, P3A, FTM, FTA, REB, AST, STL, BLK]
const RAW = {
  'Zhou Qi': [
    ['KOR', '2025-11-28', 16, 11, 3, 6, 0, 0, 5, 10, 12, 0, 0, 0],
    ['KOR', '2025-12-01', 21, 17, 6, 6, 0, 0, 5, 6, 15, 0, 0, 1],
  ],
  'Hu Jinqiu': [
    ['KOR', '2025-11-28', 23, 10, 5, 6, 0, 0, 1, 1, 3, 0, 0, 0],
    ['KOR', '2025-12-01', 19, 18, 7, 9, 0, 0, 4, 4, 4, 1, 1, 0],
    ['JPN', '2026-02-26', 28, 20, 9, 10, 0, 0, 2, 3, 12, 0, 0, 1],
    ['TPE', '2026-03-01', 27, 15, 4, 8, 0, 0, 7, 8, 6, 1, 0, 0],
    ['JPN', '2026-07-03', 26, 15, 7, 11, 1, 2, 0, 0, 4, 2, 0, 0],
    ['TPE', '2026-07-06', 23, 13, 5, 6, 0, 0, 3, 3, 6, 1, 1, 0],
  ],
  'Zhao Jiwei': [
    ['JPN', '2026-02-26', 18, 14, 4, 8, 3, 6, 3, 3, 2, 2, 1, 0],
    ['TPE', '2026-03-01', 15, 13, 4, 7, 3, 6, 2, 2, 3, 3, 0, 0],
    ['JPN', '2026-07-03', 23, 4, 1, 7, 0, 4, 2, 3, 3, 4, 0, 0],
    ['TPE', '2026-07-06', 24, 17, 6, 12, 5, 10, 0, 0, 4, 6, 2, 0],
  ],
  'Cheng Shuaipeng': [
    ['KOR', '2025-11-28', 26, 6, 2, 8, 2, 6, 0, 0, 2, 2, 0, 1],
    ['KOR', '2025-12-01', 18, 19, 6, 8, 4, 6, 3, 4, 0, 0, 0, 0],
  ],
  'Zhu Junlong': [
    ['KOR', '2025-11-28', 19, 2, 1, 4, 0, 2, 0, 0, 2, 1, 2, 1],
    ['KOR', '2025-12-01', 32, 2, 0, 4, 0, 3, 2, 2, 7, 2, 0, 0],
    ['JPN', '2026-02-26', 32, 6, 1, 5, 1, 2, 3, 4, 9, 2, 0, 0],
    ['TPE', '2026-03-01', 30, 19, 7, 10, 5, 6, 0, 0, 4, 2, 0, 0],
    ['JPN', '2026-07-03', 22, 0, 0, 2, 0, 1, 0, 0, 7, 2, 0, 0],
    ['TPE', '2026-07-06', 28, 4, 1, 6, 0, 1, 2, 2, 6, 0, 1, 0],
  ],
  'Liao Sanning': [
    ['KOR', '2025-11-28', 26, 17, 6, 11, 0, 2, 5, 6, 4, 4, 2, 0],
    ['KOR', '2025-12-01', 24, 8, 4, 9, 0, 3, 0, 1, 1, 10, 1, 0],
    ['JPN', '2026-02-26', 29, 16, 7, 15, 0, 1, 2, 5, 2, 5, 1, 0],
    ['TPE', '2026-03-01', 19, 8, 3, 9, 0, 0, 2, 2, 2, 3, 0, 0],
    ['JPN', '2026-07-03', 23, 14, 6, 14, 0, 3, 2, 2, 4, 4, 1, 0],
    ['TPE', '2026-07-06', 16, 5, 2, 6, 0, 0, 1, 2, 1, 3, 0, 0],
  ],
  'Zhao Rui': [
    ['JPN', '2026-02-26', 19, 10, 1, 4, 0, 3, 8, 8, 3, 3, 2, 0],
    ['TPE', '2026-03-01', 27, 12, 2, 13, 2, 7, 6, 9, 5, 5, 1, 0],
  ],
  'Yang Hansen': [
    ['JPN', '2026-07-03', 14, 9, 3, 5, 0, 0, 3, 6, 7, 2, 1, 1],
    ['TPE', '2026-07-06', 17, 10, 4, 8, 0, 1, 2, 4, 4, 1, 1, 1],
  ],
  'Zeng Fanbo': [
    ['KOR', '2025-11-28', 11, 2, 1, 3, 0, 2, 0, 0, 1, 1, 0, 1],
    ['KOR', '2025-12-01', 6, 0, 0, 2, 0, 1, 0, 2, 0, 0, 0, 0],
  ],
  'He Xining': [
    ['JPN', '2026-02-26', 24, 12, 4, 8, 3, 7, 1, 2, 1, 2, 3, 0],
    ['TPE', '2026-03-01', 20, 10, 4, 9, 2, 5, 0, 0, 1, 1, 1, 0],
    ['JPN', '2026-07-03', 27, 12, 5, 15, 2, 6, 0, 0, 1, 2, 0, 0],
    ['TPE', '2026-07-06', 12, 4, 1, 3, 0, 1, 2, 2, 4, 1, 0, 0],
  ],
  'Gao Shiyan': [
    ['KOR', '2025-11-28', 22, 6, 2, 8, 2, 6, 0, 0, 7, 2, 2, 0],
    ['KOR', '2025-12-01', 19, 6, 2, 6, 1, 4, 1, 2, 1, 2, 1, 0],
    ['JPN', '2026-02-26', 8, 3, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0],
    ['TPE', '2026-03-01', 8, 3, 1, 1, 1, 1, 0, 0, 2, 1, 0, 0],
    ['JPN', '2026-07-03', 17, 2, 1, 2, 0, 1, 0, 1, 2, 1, 1, 0],
    ['TPE', '2026-07-06', 16, 4, 1, 3, 0, 2, 2, 2, 3, 2, 0, 0],
  ],
  'Xu Xin': [
    ['JPN', '2026-07-03', 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ['TPE', '2026-07-06', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

function pct(m, a) { return a > 0 ? Math.round((m / a) * 1000) / 10 : null; }

function buildRow([opp, date, MIN, PTS, FGM, FGA, P3M, P3A, FTM, FTA, REB, AST, STL, BLK]) {
  const P2M = FGM - P3M, P2A = FGA - P3A;
  const EFF = PTS + REB + AST + STL + BLK - (FGA - FGM) - (FTA - FTM);
  return {
    opp, date, rd,
    MIN, PTS,
    FGM, FGA, FGP: pct(FGM, FGA),
    P2M, P2A, P2P: pct(P2M, P2A),
    P3M, P3A, P3P: pct(P3M, P3A),
    FTM, FTA, FTP: pct(FTM, FTA),
    OREB: null, DREB: null, REB,
    AST, PF: null, TO: null, STL, BLK,
    PM: null, EFF,
  };
}

const onlyName = process.argv[2] || null;

async function main() {
  const [team] = await get('/rest/v1/teams?select=id&name=eq.' + encodeURIComponent('중국 남자농구 국가대표팀'));
  const players = (await get(`/rest/v1/players?team_id=eq.${team.id}&select=id,name,stats`))
    .filter((p) => !onlyName || p.name === onlyName);
  for (const p of players) {
    const raw = RAW[p.name];
    if (!raw) { console.log('SKIP (no game log)', p.name); continue; }
    const gameLog = raw.map(buildRow);
    const merged = { ...p.stats, GAME_LOG: gameLog };
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: merged });
    console.log('patched', p.name, 'games', gameLog.length);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
