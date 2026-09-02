// Adds Nigeria players' individual GAME_LOG entries for the 4 remaining
// Qualifying Tournament games (vs Colombia, Philippines, France, Germany) —
// the KOR game was already added in addFranceNigeriaWomenTeams.js. Box scores
// pulled from FIBA, each cross-checked against the team AST total (all 4
// matched exactly) before use.
// Usage: node scripts/addNigeriaGameLogsFull.js
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

const NIGERIA_TEAM_ID = '9f4626ee-7891-4fd3-be6c-040bc0deb5e7';

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

// jersey -> row, for each game (Nigeria side only)
// ---- NGR vs COL, 2026-03-11, 조별리그 (checksum: team AST 23 verified) ----
const NGR_VS_COL = {
  0: { min: '14:17', pts: 5, fgm: 2, fga: 5, p2m: 2, p2a: 3, p3m: 0, p3a: 2, ftm: 1, fta: 2, oreb: 0, dreb: 1, reb: 1, ast: 1, pf: 0, to: 0, stl: 1, blk: 0, pm: 4, eff: 4 },
  3: { min: '17:06', pts: 5, fgm: 1, fga: 4, p2m: 1, p2a: 4, p3m: 0, p3a: 0, ftm: 3, fta: 3, oreb: 2, dreb: 8, reb: 10, ast: 2, pf: 3, to: 1, stl: 0, blk: 2, pm: 22, eff: 15 },
  4: { min: '25:07', pts: 8, fgm: 3, fga: 8, p2m: 1, p2a: 2, p3m: 2, p3a: 6, ftm: 0, fta: 0, oreb: 1, dreb: 3, reb: 4, ast: 2, pf: 0, to: 1, stl: 1, blk: 1, pm: 29, eff: 10 },
  7: { min: '03:28', pts: 0, fgm: 0, fga: 0, p2m: 0, p2a: 0, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: 2, eff: 0 },
  9: { min: '28:01', pts: 10, fgm: 5, fga: 9, p2m: 5, p2a: 7, p3m: 0, p3a: 2, ftm: 0, fta: 0, oreb: 2, dreb: 2, reb: 4, ast: 3, pf: 1, to: 1, stl: 2, blk: 0, pm: 29, eff: 14 },
  10: { min: '22:22', pts: 6, fgm: 2, fga: 7, p2m: 2, p2a: 6, p3m: 0, p3a: 1, ftm: 2, fta: 4, oreb: 1, dreb: 1, reb: 2, ast: 3, pf: 2, to: 0, stl: 0, blk: 0, pm: 8, eff: 4 },
  20: { min: '16:07', pts: 4, fgm: 2, fga: 5, p2m: 2, p2a: 5, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 3, dreb: 5, reb: 8, ast: 2, pf: 0, to: 1, stl: 0, blk: 1, pm: 10, eff: 11 },
  22: { dnp: true },
  23: { min: '21:16', pts: 8, fgm: 3, fga: 9, p2m: 3, p2a: 5, p3m: 0, p3a: 4, ftm: 2, fta: 3, oreb: 1, dreb: 1, reb: 2, ast: 4, pf: 3, to: 0, stl: 1, blk: 0, pm: 18, eff: 8 },
  25: { min: '14:20', pts: 13, fgm: 5, fga: 6, p2m: 5, p2a: 5, p3m: 0, p3a: 1, ftm: 3, fta: 3, oreb: 0, dreb: 6, reb: 6, ast: 1, pf: 1, to: 0, stl: 0, blk: 0, pm: 18, eff: 19 },
  32: { min: '14:16', pts: 1, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 1, fta: 4, oreb: 2, dreb: 0, reb: 2, ast: 0, pf: 2, to: 2, stl: 1, blk: 1, pm: 2, eff: -1 },
  33: { min: '23:40', pts: 10, fgm: 3, fga: 10, p2m: 2, p2a: 6, p3m: 1, p3a: 4, ftm: 3, fta: 4, oreb: 1, dreb: 10, reb: 11, ast: 5, pf: 3, to: 2, stl: 1, blk: 0, pm: 23, eff: 17 },
};
// ---- NGR vs PHI, 2026-03-14, 조별리그 (checksum: team AST 36 verified) ----
const NGR_VS_PHI = {
  0: { dnp: true },
  3: { min: '15:39', pts: 10, fgm: 5, fga: 8, p2m: 5, p2a: 8, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 3, dreb: 6, reb: 9, ast: 0, pf: 0, to: 2, stl: 1, blk: 0, pm: 8, eff: 15 },
  4: { min: '24:56', pts: 14, fgm: 6, fga: 10, p2m: 4, p2a: 5, p3m: 2, p3a: 5, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 2, pf: 0, to: 2, stl: 0, blk: 2, pm: -4, eff: 13 },
  7: { min: '07:48', pts: 6, fgm: 2, fga: 6, p2m: 0, p2a: 2, p3m: 2, p3a: 4, ftm: 0, fta: 0, oreb: 1, dreb: 1, reb: 2, ast: 1, pf: 0, to: 0, stl: 1, blk: 0, pm: 0, eff: 6 },
  9: { min: '23:44', pts: 9, fgm: 3, fga: 6, p2m: 3, p2a: 6, p3m: 0, p3a: 0, ftm: 3, fta: 6, oreb: 0, dreb: 1, reb: 1, ast: 4, pf: 0, to: 2, stl: 1, blk: 0, pm: 7, eff: 7 },
  10: { min: '21:45', pts: 5, fgm: 2, fga: 5, p2m: 1, p2a: 3, p3m: 1, p3a: 2, ftm: 0, fta: 0, oreb: 1, dreb: 5, reb: 6, ast: 4, pf: 5, to: 3, stl: 0, blk: 1, pm: 20, eff: 10 },
  20: { min: '22:34', pts: 10, fgm: 5, fga: 10, p2m: 5, p2a: 9, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 3, dreb: 9, reb: 12, ast: 8, pf: 0, to: 3, stl: 1, blk: 1, pm: 12, eff: 24 },
  22: { dnp: true },
  23: { min: '28:01', pts: 13, fgm: 2, fga: 6, p2m: 2, p2a: 5, p3m: 0, p3a: 1, ftm: 9, fta: 11, oreb: 0, dreb: 2, reb: 2, ast: 7, pf: 4, to: 2, stl: 3, blk: 0, pm: 9, eff: 17 },
  25: { min: '21:15', pts: 16, fgm: 5, fga: 12, p2m: 3, p2a: 8, p3m: 2, p3a: 4, ftm: 4, fta: 4, oreb: 1, dreb: 5, reb: 6, ast: 5, pf: 3, to: 0, stl: 0, blk: 2, pm: 13, eff: 22 },
  32: { min: '16:29', pts: 3, fgm: 1, fga: 2, p2m: 1, p2a: 2, p3m: 0, p3a: 0, ftm: 1, fta: 2, oreb: 3, dreb: 1, reb: 4, ast: 2, pf: 1, to: 2, stl: 1, blk: 0, pm: 5, eff: 6 },
  33: { min: '17:49', pts: 15, fgm: 5, fga: 11, p2m: 4, p2a: 10, p3m: 1, p3a: 1, ftm: 4, fta: 5, oreb: 5, dreb: 7, reb: 12, ast: 3, pf: 2, to: 2, stl: 1, blk: 1, pm: 15, eff: 23 },
};
// ---- FRA vs NGR, 2026-03-16, 조별리그 (checksum: team AST 15 verified) ----
const NGR_VS_FRA = {
  0: { min: '17:43', pts: 16, fgm: 6, fga: 8, p2m: 5, p2a: 5, p3m: 1, p3a: 3, ftm: 3, fta: 4, oreb: 0, dreb: 2, reb: 2, ast: 0, pf: 0, to: 2, stl: 1, blk: 0, pm: -7, eff: 14 },
  3: { min: '12:12', pts: 4, fgm: 2, fga: 4, p2m: 2, p2a: 4, p3m: 0, p3a: 0, ftm: 0, fta: 1, oreb: 3, dreb: 2, reb: 5, ast: 0, pf: 4, to: 1, stl: 2, blk: 0, pm: 5, eff: 7 },
  4: { min: '34:58', pts: 15, fgm: 5, fga: 11, p2m: 3, p2a: 4, p3m: 2, p3a: 7, ftm: 3, fta: 6, oreb: 4, dreb: 4, reb: 8, ast: 3, pf: 2, to: 0, stl: 0, blk: 1, pm: -3, eff: 18 },
  7: { dnp: true },
  9: { min: '05:06', pts: 0, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: -2, eff: -1 },
  10: { min: '31:58', pts: 10, fgm: 4, fga: 13, p2m: 2, p2a: 7, p3m: 2, p3a: 6, ftm: 0, fta: 0, oreb: 1, dreb: 1, reb: 2, ast: 5, pf: 4, to: 1, stl: 1, blk: 0, pm: 0, eff: 8 },
  20: { min: '27:48', pts: 15, fgm: 6, fga: 11, p2m: 6, p2a: 11, p3m: 0, p3a: 0, ftm: 3, fta: 4, oreb: 3, dreb: 2, reb: 5, ast: 1, pf: 2, to: 1, stl: 2, blk: 1, pm: -12, eff: 17 },
  22: { dnp: true },
  23: { min: '32:53', pts: 14, fgm: 5, fga: 13, p2m: 4, p2a: 9, p3m: 1, p3a: 4, ftm: 3, fta: 5, oreb: 2, dreb: 2, reb: 4, ast: 3, pf: 5, to: 3, stl: 2, blk: 0, pm: -8, eff: 10 },
  25: { min: '28:06', pts: 10, fgm: 2, fga: 7, p2m: 1, p2a: 3, p3m: 1, p3a: 3, ftm: 5, fta: 6, oreb: 2, dreb: 4, reb: 6, ast: 2, pf: 2, to: 2, stl: 1, blk: 1, pm: -2, eff: 12 },
  32: { dnp: true },
  33: { min: '09:16', pts: 2, fgm: 1, fga: 3, p2m: 1, p2a: 3, p3m: 0, p3a: 0, ftm: 0, fta: 2, oreb: 3, dreb: 1, reb: 4, ast: 1, pf: 0, to: 0, stl: 0, blk: 0, pm: -6, eff: 3 },
};
// ---- NGR vs GER, 2026-03-18, 조별리그 (checksum: team AST 19 verified) ----
const NGR_VS_GER = {
  0: { min: '19:56', pts: 12, fgm: 4, fga: 8, p2m: 3, p2a: 5, p3m: 1, p3a: 3, ftm: 3, fta: 3, oreb: 0, dreb: 0, reb: 0, ast: 2, pf: 2, to: 0, stl: 0, blk: 0, pm: 1, eff: 10 },
  3: { min: '06:09', pts: 1, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 1, fta: 2, oreb: 3, dreb: 2, reb: 5, ast: 0, pf: 0, to: 2, stl: 0, blk: 1, pm: -3, eff: 3 },
  4: { min: '30:48', pts: 15, fgm: 5, fga: 11, p2m: 2, p2a: 6, p3m: 3, p3a: 5, ftm: 2, fta: 2, oreb: 0, dreb: 3, reb: 3, ast: 1, pf: 3, to: 1, stl: 0, blk: 0, pm: -7, eff: 12 },
  7: { min: '09:54', pts: 3, fgm: 1, fga: 5, p2m: 0, p2a: 1, p3m: 1, p3a: 4, ftm: 0, fta: 0, oreb: 0, dreb: 3, reb: 3, ast: 0, pf: 1, to: 0, stl: 0, blk: 1, pm: -8, eff: 3 },
  9: { min: '11:41', pts: 3, fgm: 1, fga: 3, p2m: 1, p2a: 1, p3m: 0, p3a: 2, ftm: 1, fta: 2, oreb: 1, dreb: 2, reb: 3, ast: 2, pf: 1, to: 1, stl: 0, blk: 0, pm: 3, eff: 4 },
  10: { min: '22:34', pts: 7, fgm: 3, fga: 7, p2m: 2, p2a: 3, p3m: 1, p3a: 4, ftm: 0, fta: 2, oreb: 1, dreb: 3, reb: 4, ast: 5, pf: 2, to: 2, stl: 2, blk: 0, pm: 2, eff: 10 },
  20: { min: '28:01', pts: 13, fgm: 4, fga: 10, p2m: 4, p2a: 10, p3m: 0, p3a: 0, ftm: 5, fta: 6, oreb: 1, dreb: 6, reb: 7, ast: 2, pf: 3, to: 5, stl: 3, blk: 1, pm: 1, eff: 14 },
  22: { min: '02:17', pts: 0, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: -4, eff: -1 },
  23: { min: '35:51', pts: 5, fgm: 2, fga: 6, p2m: 2, p2a: 3, p3m: 0, p3a: 3, ftm: 1, fta: 3, oreb: 0, dreb: 3, reb: 3, ast: 5, pf: 2, to: 4, stl: 0, blk: 0, pm: -13, eff: 9 },
  25: { min: '18:31', pts: 7, fgm: 3, fga: 9, p2m: 2, p2a: 6, p3m: 1, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 6, reb: 6, ast: 2, pf: 1, to: 0, stl: 0, blk: 2, pm: -2, eff: 10 },
  32: { min: '03:33', pts: 2, fgm: 1, fga: 3, p2m: 1, p2a: 3, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 2, dreb: 1, reb: 3, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: -2, eff: 3 },
  33: { min: '10:45', pts: 5, fgm: 2, fga: 6, p2m: 2, p2a: 5, p3m: 0, p3a: 1, ftm: 1, fta: 1, oreb: 1, dreb: 0, reb: 1, ast: 0, pf: 0, to: 1, stl: 0, blk: 0, pm: -8, eff: 1 },
};

async function main() {
  const players = await get(`/rest/v1/players?team_id=eq.${NIGERIA_TEAM_ID}&select=id,jersey_number,name,stats`);
  for (const p of players) {
    const j = p.jersey_number;
    const existing = p.stats.GAME_LOG || []; // already has the KOR entry (2026-03-12)
    const byOpp = Object.fromEntries(existing.map((e) => [e.opp, e]));
    const colEntry = gameLogEntry('COL', '2026-03-11', '조별리그', NGR_VS_COL[j]);
    const phiEntry = gameLogEntry('PHI', '2026-03-14', '조별리그', NGR_VS_PHI[j]);
    const fraEntry = gameLogEntry('FRA', '2026-03-16', '조별리그', NGR_VS_FRA[j]);
    const gerEntry = gameLogEntry('GER', '2026-03-18', '조별리그', NGR_VS_GER[j]);
    const merged = [colEntry, byOpp.KOR, phiEntry, fraEntry, gerEntry].filter(Boolean);
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: { ...p.stats, GAME_LOG: merged } });
    console.log('updated GAME_LOG for', p.name, merged.length, merged.map((g) => g.opp).join(','));
  }
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
