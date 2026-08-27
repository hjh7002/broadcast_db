// Adds structured NATIONAL_TEAM_BY_YEAR / NATIONAL_TEAM_CAREER tables to Japan's
// two most reliable/notable players with solid Round-1 stat data (Hawkinson,
// Watanabe) — per scripts/seedJapan.js's roster. Skips everyone else per the
// "skip rather than publish shaky numbers" rule (see BBALL_NT_PATTERN.md).
//
// Usage:  node scripts/patchJapanCareerTables.js
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

const CAREER = {
  'Josh Hawkinson': {
    NATIONAL_TEAM_BY_YEAR: [{ season: 2027, team: '월드컵 아시아 예선', GP: 5, PTS: 21.6, REB: 9.4, AST: 3.6, EFF: 28.0 }],
    NATIONAL_TEAM_CAREER: { PTS: 21.6, REB: 9.4, AST: 3.6, EFF: 28.0 },
  },
  'Yuta Watanabe': {
    NATIONAL_TEAM_BY_YEAR: [{ season: 2027, team: '월드컵 아시아 예선', GP: 6, PTS: 16.0, REB: 6.8, AST: 1.8, EFF: 18.2 }],
    NATIONAL_TEAM_CAREER: { PTS: 16.0, REB: 6.8, AST: 1.8, EFF: 18.2 },
  },
};

async function main() {
  const [team] = await get('/rest/v1/teams?select=id&name=eq.' + encodeURIComponent('일본 남자농구 국가대표팀'));
  const players = await get(`/rest/v1/players?team_id=eq.${team.id}&select=id,name,stats`);
  for (const p of players) {
    const extra = CAREER[p.name];
    if (!extra) continue;
    const stats = { ...p.stats, ...extra };
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats });
    console.log('patched', p.name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
