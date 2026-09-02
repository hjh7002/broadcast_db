// Adds Korea players' individual GAME_LOG entries for the 3 remaining
// Qualifying Tournament games not yet covered (Germany, Colombia, Philippines
// were already done for Nigeria/France in addFranceNigeriaWomenTeams.js).
// Box scores pulled from FIBA, each cross-checked against the team AST total
// before use (all 3 matched exactly).
// Usage: node scripts/addKorGameLogsGerColPhi.js
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
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 400) return reject(new Error(`${method} ${path} -> ${res.statusCode}: ${d}`));
        try { resolve(d ? JSON.parse(d) : null); } catch { resolve(d); }
      });
    });
    r.on('error', reject); if (payload) r.write(payload); r.end();
  });
}
const get = (path) => req('GET', path);
const patch = (path, body) => req('PATCH', path, body);

const KOR_IDS = {
  박지현: 'f92cf976-10ba-40c1-b04f-baa760c0811b', 허예은: 'af0a2f13-f69f-4de6-b80b-2da605f60a49',
  강이슬: '1deda4af-32bd-4832-beee-60d400f514cc', 박지수: 'f4874622-b226-41d1-b1c2-2a0d023bb5e8',
  안혜지: 'd5785f23-fd82-46cd-91cd-7de7d3538fb9', 최이샘: '10ce2789-3cc9-4263-a4ea-ffac243f1771',
  이소희: 'b514855f-9c2e-431a-a480-6e1bcd3a3e3f', 강유림: 'b93fc1a7-9321-4655-849a-d11b9056ee0b',
  홍유순: 'f8d4cd72-d581-4601-9bc5-fd4c24b9e03e', 박소희: '7cec861b-b289-4c09-96d0-447d5ec79df0',
  진안: 'aa1261fd-339a-48b3-a77b-fc5c90207271', 이해란: '4b658017-bd0c-487b-9fbb-f212240d927c',
};

function gameLogEntry(opp, date, rd, row) {
  if (!row || row.dnp) return null;
  const [mm, ss] = row.min.split(':').map(Number);
  const min = mm + (ss >= 30 ? 1 : 0);
  const pct = (m, a) => (a > 0 ? Math.round((m / a) * 1000) / 10 : a === 0 ? null : 0);
  return {
    opp, date, rd, MIN: min, PTS: row.pts,
    FGM: row.fgm, FGA: row.fga, FGP: pct(row.fgm, row.fga),
    P2M: row.p2m, P2A: row.p2a, P2P: pct(row.p2m, row.p2a),
    P3M: row.p3m, P3A: row.p3a, P3P: pct(row.p3m, row.p3a),
    FTM: row.ftm, FTA: row.fta, FTP: pct(row.ftm, row.fta),
    OREB: row.oreb, DREB: row.dreb, REB: row.reb, AST: row.ast,
    PF: row.pf, TO: row.to, STL: row.stl, BLK: row.blk, PM: row.pm, EFF: row.eff,
  };
}

// ---- KOR vs GER, 2026-03-12, 조별리그 (checksum: team AST 19 verified) ----
const KOR_VS_GER = {
  박지현: { min: '16:38', pts: 6, fgm: 2, fga: 5, p2m: 2, p2a: 3, p3m: 0, p3a: 2, ftm: 2, fta: 2, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 2, to: 2, stl: 1, blk: 0, pm: -8, eff: 2 },
  허예은: { min: '21:27', pts: 0, fgm: 0, fga: 5, p2m: 0, p2a: 0, p3m: 0, p3a: 5, ftm: 0, fta: 0, oreb: 1, dreb: 2, reb: 3, ast: 6, pf: 0, to: 1, stl: 1, blk: 0, pm: -21, eff: 4 },
  강이슬: { min: '21:38', pts: 11, fgm: 4, fga: 10, p2m: 2, p2a: 3, p3m: 2, p3a: 7, ftm: 1, fta: 1, oreb: 0, dreb: 1, reb: 1, ast: 2, pf: 2, to: 3, stl: 1, blk: 0, pm: -8, eff: 6 },
  안혜지: { min: '18:33', pts: 3, fgm: 1, fga: 1, p2m: 0, p2a: 0, p3m: 1, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 5, pf: 2, to: 1, stl: 1, blk: 0, pm: -6, eff: 8 },
  최이샘: { min: '19:18', pts: 8, fgm: 3, fga: 4, p2m: 1, p2a: 1, p3m: 2, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 2, reb: 2, ast: 2, pf: 0, to: 0, stl: 0, blk: 0, pm: -2, eff: 11 },
  박지수: { min: '17:44', pts: 7, fgm: 3, fga: 9, p2m: 3, p2a: 8, p3m: 0, p3a: 1, ftm: 1, fta: 2, oreb: 0, dreb: 5, reb: 5, ast: 2, pf: 1, to: 1, stl: 1, blk: 2, pm: -2, eff: 9 },
  이소희: { min: '16:23', pts: 2, fgm: 1, fga: 7, p2m: 1, p2a: 2, p3m: 0, p3a: 5, ftm: 0, fta: 0, oreb: 0, dreb: 2, reb: 2, ast: 0, pf: 4, to: 0, stl: 0, blk: 0, pm: -13, eff: -2 },
  강유림: { min: '15:47', pts: 0, fgm: 0, fga: 5, p2m: 0, p2a: 1, p3m: 0, p3a: 4, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 0, pf: 0, to: 0, stl: 0, blk: 1, pm: -13, eff: -3 },
  박소희: { min: '05:08', pts: 1, fgm: 0, fga: 2, p2m: 0, p2a: 1, p3m: 0, p3a: 1, ftm: 1, fta: 2, oreb: 0, dreb: 1, reb: 1, ast: 0, pf: 2, to: 1, stl: 0, blk: 0, pm: -7, eff: -2 },
  이해란: { min: '19:40', pts: 4, fgm: 1, fga: 9, p2m: 1, p2a: 6, p3m: 0, p3a: 3, ftm: 2, fta: 4, oreb: 2, dreb: 4, reb: 6, ast: 1, pf: 3, to: 2, stl: 2, blk: 1, pm: -26, eff: 2 },
  홍유순: { min: '11:46', pts: 2, fgm: 1, fga: 3, p2m: 1, p2a: 2, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 1, pf: 0, to: 0, stl: 2, blk: 0, pm: -12, eff: 3 },
  진안: { min: '15:58', pts: 5, fgm: 1, fga: 6, p2m: 1, p2a: 6, p3m: 0, p3a: 0, ftm: 3, fta: 4, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 4, to: 2, stl: 1, blk: 0, pm: -17, eff: -2 },
};

// ---- KOR vs COL, 2026-03-15, 조별리그 (checksum: team AST 25 verified) ----
const KOR_VS_COL = {
  박지현: { min: '24:56', pts: 13, fgm: 5, fga: 9, p2m: 4, p2a: 5, p3m: 1, p3a: 4, ftm: 2, fta: 2, oreb: 0, dreb: 1, reb: 1, ast: 2, pf: 1, to: 0, stl: 1, blk: 0, pm: 34, eff: 13 },
  허예은: { min: '18:23', pts: 5, fgm: 2, fga: 4, p2m: 1, p2a: 1, p3m: 1, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 2, reb: 2, ast: 6, pf: 4, to: 1, stl: 1, blk: 0, pm: 20, eff: 11 },
  강이슬: { min: '21:22', pts: 21, fgm: 7, fga: 10, p2m: 0, p2a: 0, p3m: 7, p3a: 10, ftm: 0, fta: 0, oreb: 0, dreb: 5, reb: 5, ast: 3, pf: 0, to: 0, stl: 3, blk: 0, pm: 30, eff: 29 },
  안혜지: { min: '14:34', pts: 2, fgm: 0, fga: 3, p2m: 0, p2a: 2, p3m: 0, p3a: 1, ftm: 2, fta: 2, oreb: 1, dreb: 1, reb: 2, ast: 2, pf: 3, to: 0, stl: 1, blk: 0, pm: 19, eff: 4 },
  최이샘: { min: '16:01', pts: 4, fgm: 2, fga: 4, p2m: 2, p2a: 4, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 1, dreb: 3, reb: 4, ast: 2, pf: 1, to: 1, stl: 0, blk: 1, pm: 26, eff: 8 },
  박지수: { min: '17:06', pts: 11, fgm: 3, fga: 5, p2m: 3, p2a: 4, p3m: 0, p3a: 1, ftm: 5, fta: 6, oreb: 0, dreb: 6, reb: 6, ast: 1, pf: 1, to: 2, stl: 1, blk: 0, pm: 17, eff: 14 },
  이소희: { min: '10:14', pts: 9, fgm: 3, fga: 4, p2m: 0, p2a: 1, p3m: 3, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 1, pf: 3, to: 2, stl: 0, blk: 0, pm: -4, eff: 8 },
  강유림: { min: '16:22', pts: 6, fgm: 2, fga: 4, p2m: 0, p2a: 1, p3m: 2, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 2, pf: 0, to: 0, stl: 1, blk: 0, pm: -1, eff: 7 },
  박소희: { min: '11:53', pts: 0, fgm: 0, fga: 5, p2m: 0, p2a: 2, p3m: 0, p3a: 3, ftm: 0, fta: 0, oreb: 2, dreb: 0, reb: 2, ast: 2, pf: 1, to: 2, stl: 1, blk: 0, pm: -9, eff: -2 },
  이해란: { min: '16:13', pts: 9, fgm: 2, fga: 9, p2m: 1, p2a: 7, p3m: 1, p3a: 2, ftm: 4, fta: 4, oreb: 1, dreb: 1, reb: 2, ast: 2, pf: 2, to: 1, stl: 2, blk: 1, pm: 20, eff: 8 },
  홍유순: { min: '10:00', pts: 2, fgm: 1, fga: 3, p2m: 1, p2a: 2, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 2, dreb: 0, reb: 2, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: -11, eff: 2 },
  진안: { min: '22:56', pts: 0, fgm: 0, fga: 4, p2m: 0, p2a: 4, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 1, dreb: 6, reb: 7, ast: 2, pf: 4, to: 1, stl: 0, blk: 0, pm: 9, eff: 4 },
};

// ---- KOR vs PHI, 2026-03-15, 조별리그 (checksum: team AST 33 verified) ----
const KOR_VS_PHI = {
  박지현: { min: '26:35', pts: 11, fgm: 5, fga: 13, p2m: 5, p2a: 9, p3m: 0, p3a: 4, ftm: 1, fta: 2, oreb: 2, dreb: 7, reb: 9, ast: 3, pf: 2, to: 2, stl: 1, blk: 0, pm: 21, eff: 13 },
  허예은: { min: '19:44', pts: 11, fgm: 4, fga: 5, p2m: 1, p2a: 1, p3m: 3, p3a: 4, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 6, pf: 2, to: 3, stl: 1, blk: 0, pm: 16, eff: 15 },
  강이슬: { min: '26:04', pts: 24, fgm: 8, fga: 20, p2m: 0, p2a: 2, p3m: 8, p3a: 18, ftm: 0, fta: 0, oreb: 0, dreb: 3, reb: 3, ast: 1, pf: 2, to: 1, stl: 3, blk: 0, pm: 26, eff: 18 },
  안혜지: { min: '15:11', pts: 1, fgm: 0, fga: 0, p2m: 0, p2a: 0, p3m: 0, p3a: 0, ftm: 1, fta: 2, oreb: 1, dreb: 2, reb: 3, ast: 6, pf: 3, to: 0, stl: 1, blk: 0, pm: 16, eff: 10 },
  최이샘: { min: '23:17', pts: 15, fgm: 6, fga: 10, p2m: 3, p2a: 3, p3m: 3, p3a: 7, ftm: 0, fta: 0, oreb: 2, dreb: 3, reb: 5, ast: 3, pf: 3, to: 1, stl: 1, blk: 0, pm: 18, eff: 19 },
  박지수: { min: '15:01', pts: 10, fgm: 4, fga: 8, p2m: 4, p2a: 7, p3m: 0, p3a: 1, ftm: 2, fta: 2, oreb: 6, dreb: 3, reb: 9, ast: 3, pf: 1, to: 4, stl: 0, blk: 1, pm: 19, eff: 15 },
  이소희: { min: '13:20', pts: 6, fgm: 2, fga: 6, p2m: 0, p2a: 2, p3m: 2, p3a: 4, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 4, pf: 4, to: 1, stl: 1, blk: 0, pm: 15, eff: 6 },
  강유림: { min: '07:34', pts: 3, fgm: 1, fga: 3, p2m: 0, p2a: 0, p3m: 1, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 1, pf: 1, to: 0, stl: 0, blk: 0, pm: -4, eff: 3 },
  박소희: { min: '06:46', pts: 3, fgm: 1, fga: 1, p2m: 0, p2a: 0, p3m: 1, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 1, pf: 2, to: 0, stl: 0, blk: 0, pm: 2, eff: 4 },
  이해란: { min: '19:44', pts: 15, fgm: 6, fga: 9, p2m: 5, p2a: 8, p3m: 1, p3a: 1, ftm: 2, fta: 2, oreb: 0, dreb: 1, reb: 1, ast: 2, pf: 3, to: 1, stl: 1, blk: 1, pm: 13, eff: 16 },
  홍유순: { min: '07:34', pts: 2, fgm: 1, fga: 1, p2m: 1, p2a: 1, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 2, dreb: 0, reb: 2, ast: 1, pf: 1, to: 1, stl: 0, blk: 0, pm: -1, eff: 4 },
  진안: { min: '19:10', pts: 4, fgm: 2, fga: 4, p2m: 2, p2a: 4, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 3, dreb: 3, reb: 6, ast: 2, pf: 3, to: 0, stl: 2, blk: 0, pm: 14, eff: 12 },
};

async function main() {
  for (const [name, id] of Object.entries(KOR_IDS)) {
    const [p] = await get(`/rest/v1/players?id=eq.${id}&select=stats`);
    const existing = p.stats.GAME_LOG || [];
    const gerEntry = gameLogEntry('GER', '2026-03-12', '조별리그', KOR_VS_GER[name]);
    const colEntry = gameLogEntry('COL', '2026-03-15', '조별리그', KOR_VS_COL[name]);
    const phiEntry = gameLogEntry('PHI', '2026-03-15', '조별리그', KOR_VS_PHI[name]);
    // Keep chronological order: GER(3/12) already precedes NGR(3/12) added earlier;
    // insert GER before NGR, then COL/PHI(3/15) before FRA(3/18).
    const byOpp = Object.fromEntries(existing.map((e) => [e.opp, e]));
    const merged = [gerEntry, byOpp.NGR, colEntry, phiEntry, byOpp.FRA].filter(Boolean);
    await patch(`/rest/v1/players?id=eq.${id}`, { stats: { ...p.stats, GAME_LOG: merged } });
    console.log('updated GAME_LOG for', name, merged.length, merged.map((g) => g.opp).join(','));
  }
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
