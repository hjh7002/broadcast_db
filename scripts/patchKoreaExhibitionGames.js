// Adds two Korea-Japan exhibition ("평가전") games to GAME_LOG for the 8 of our
// 12 final-roster players who appear in the user-provided box sheets.
// 4 names in the box sheets (강성욱/김보배/양재석/이종현) aren't in our 12-man DB
// (extended-pool call-ups, not final roster) and are skipped.
//
// Usage: node scripts/patchKoreaExhibitionGames.js
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

function mmss(s) {
  if (s == null) return null;
  const [m, sec] = s.split(':').map(Number);
  return Math.round(m + sec / 60);
}
function fg(made3, att3, made2, att2) {
  const FGM = made3 + made2, FGA = att3 + att2;
  return { FGM, FGA, FGP: FGA ? Math.round((FGM / FGA) * 1000) / 10 : null };
}
function pct(m, a) {
  return a ? Math.round((m / a) * 1000) / 10 : null;
}

// Game 1 — 2026-08-15, vs Japan (has STL/BLK/MIN, no OREB/DREB split)
const GAME1 = {
  date: '2026-08-15', opp: 'JPN', rd: '평가전',
  rows: {
    '이우석': { PTS: 14, p3: [3, 6], p2: [2, 5], ft: [1, 1], F: 2, REB: 5, TO: 1, AS: 3, ST: 2, BS: 0, MIN: '28:12' },
    '유기상': { PTS: 11, p3: [3, 7], p2: [1, 2], ft: [0, 0], F: 1, REB: 1, TO: 0, AS: 0, ST: 0, BS: 0, MIN: '18:20' },
    '변준형': { PTS: 8, p3: [0, 2], p2: [3, 6], ft: [2, 2], F: 2, REB: 2, TO: 2, AS: 4, ST: 1, BS: 0, MIN: '22:15' },
    '에디 다니엘': { PTS: 7, p3: [1, 3], p2: [2, 4], ft: [0, 0], F: 4, REB: 4, TO: 1, AS: 3, ST: 3, BS: 1, MIN: '29:30' },
    '여준석': { PTS: 6, p3: [0, 2], p2: [3, 8], ft: [0, 2], F: 3, REB: 5, TO: 2, AS: 0, ST: 0, BS: 1, MIN: '23:40' },
    '문유현': { PTS: 5, p3: [1, 2], p2: [1, 3], ft: [0, 0], F: 2, REB: 1, TO: 2, AS: 1, ST: 0, BS: 0, MIN: '15:50' },
    '이승현': { PTS: 3, p3: [0, 0], p2: [1, 4], ft: [1, 1], F: 1, REB: 3, TO: 0, AS: 1, ST: 0, BS: 0, MIN: '16:10' },
    '이원석': { PTS: 2, p3: [0, 0], p2: [1, 2], ft: [0, 0], F: 2, REB: 2, TO: 1, AS: 0, ST: 0, BS: 1, MIN: '11:20' },
  },
};

// Game 2 — 2026-08-16, vs Japan (has OREB/DREB split, no STL/BLK/MIN)
const GAME2 = {
  date: '2026-08-16', opp: 'JPN', rd: '평가전',
  rows: {
    '변준형': { PTS: 2, p3: [0, 1], p2: [1, 2], ft: [0, 0], F: 2, OREB: 1, DREB: 0, TO: 1, AS: 1 },
    '유기상': { PTS: 14, p3: [4, 9], p2: [0, 1], ft: [2, 2], F: 0, OREB: 0, DREB: 0, TO: 0, AS: 1 },
    '이우석': { PTS: 3, p3: [1, 5], p2: [0, 4], ft: [0, 0], F: 1, OREB: 0, DREB: 3, TO: 1, AS: 1 },
    '여준석': { PTS: 17, p3: [1, 4], p2: [6, 11], ft: [2, 4], F: 1, OREB: 4, DREB: 7, TO: 1, AS: 0 },
    '이원석': { PTS: 3, p3: [0, 0], p2: [0, 0], ft: [3, 4], F: 1, OREB: 0, DREB: 1, TO: 2, AS: 1 },
    '문유현': { PTS: 10, p3: [0, 3], p2: [4, 6], ft: [2, 2], F: 2, OREB: 0, DREB: 2, TO: 3, AS: 3 },
    '이승현': { PTS: 9, p3: [0, 0], p2: [4, 9], ft: [1, 1], F: 3, OREB: 1, DREB: 3, TO: 0, AS: 2 },
    '에디 다니엘': { PTS: 2, p3: [0, 2], p2: [1, 4], ft: [0, 0], F: 4, OREB: 3, DREB: 4, TO: 0, AS: 3 },
  },
};

function buildRow(g, r) {
  const { FGM, FGA, FGP } = fg(r.p3[0], r.p3[1], r.p2[0], r.p2[1]);
  const REB = r.REB ?? (r.OREB ?? 0) + (r.DREB ?? 0);
  return {
    opp: g.opp, date: g.date, rd: g.rd,
    MIN: r.MIN ? mmss(r.MIN) : null,
    PTS: r.PTS,
    FGM, FGA, FGP,
    P2M: r.p2[0], P2A: r.p2[1], P2P: pct(r.p2[0], r.p2[1]),
    P3M: r.p3[0], P3A: r.p3[1], P3P: pct(r.p3[0], r.p3[1]),
    FTM: r.ft[0], FTA: r.ft[1], FTP: pct(r.ft[0], r.ft[1]),
    OREB: r.OREB ?? null, DREB: r.DREB ?? null, REB,
    AST: r.AS, PF: r.F, TO: r.TO,
    STL: r.ST ?? null, BLK: r.BS ?? null,
    PM: null, EFF: null,
  };
}

async function main() {
  const names = new Set([...Object.keys(GAME1.rows), ...Object.keys(GAME2.rows)]);
  for (const name of names) {
    const [p] = await get('/rest/v1/players?team_id=eq.d0232f50-b48b-4e82-9602-9d740c6ad4ce&select=id,name,stats&name=eq.' + encodeURIComponent(name));
    if (!p) { console.log('SKIP (not in DB):', name); continue; }
    const existingLog = (p.stats && p.stats.GAME_LOG) || [];
    const newRows = [];
    if (GAME1.rows[name]) newRows.push(buildRow(GAME1, GAME1.rows[name]));
    if (GAME2.rows[name]) newRows.push(buildRow(GAME2, GAME2.rows[name]));
    const merged = { ...p.stats, GAME_LOG: [...existingLog, ...newRows] };
    await patch('/rest/v1/players?id=eq.' + p.id, { stats: merged });
    console.log('patched', name, '+' + newRows.length, 'exhibition games');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
