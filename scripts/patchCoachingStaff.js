// Adds head-coach info to both bball_nt teams' `extra.coaching_staff`
// (same {role, name, since} shape as CoachEntry in lib/teamRoster.ts, so
// TeamPage's existing CoachingStaffList component renders it unchanged).
//
// Usage:  node scripts/patchCoachingStaff.js
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

const COACHING = {
  '대한민국 남자농구 국가대표팀': [
    { role: '감독', name: '니콜라이스 마줄스(Nikolajs Mazurs)', since: 2025 },
  ],
  '레바논 남자농구 국가대표팀': [
    { role: '감독', name: '아흐마드 파란(Ahmad Farran)', since: 2025 },
  ],
};

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const teams = await get(`/rest/v1/teams?sport_id=eq.${sport.id}&select=id,name,extra`);
  for (const t of teams) {
    const staff = COACHING[t.name];
    if (!staff) { console.log('SKIP (no coaching data)', t.name); continue; }
    const extra = { ...t.extra, coaching_staff: staff };
    await patch(`/rest/v1/teams?id=eq.${t.id}`, { extra });
    console.log('patched', t.name, staff.map((c) => c.name).join(', '));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
