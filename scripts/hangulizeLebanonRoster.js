// Hangulizes Lebanon's roster names, matching the Korea convention:
// native-born players get Hangul-only names, naturalized players get "Hangul(English)".
// Also updates the English names embedded in teams.extra.schedule[].best_performer
// strings so they stay consistent with the new player names.
//
// Usage:  node scripts/hangulizeLebanonRoster.js
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

const LEBANON_TEAM_ID = '2e5c9f10-816c-4bb8-bf7a-b5b4d95df61f';

// English -> new name. Naturalized players keep "Hangul(English)"; everyone else Hangul-only.
const NAME_MAP = {
  'Mark Alkhoury': '마크 알쿠리',
  'Omar Jamaleddine': '오마르 자말레딘',
  'Marc Khoueiry': '마크 쿠에이리',
  'Ater Majok': '아테르 마족(Ater Majok)',
  'Amir Saoud': '아미르 사우드',
  'Joseph Abou Samra': '조셉 아부삼라',
  'Karim Zeinoun': '카림 제이눈',
  'Jad Khalil': '자드 칼릴',
  'Sergio El Darwich': '세르지오 엘다르위시',
  'Ali Mansour': '알리 만수르',
  'Dedric Lawson': '디드릭 로슨(Dedric Lawson)',
  'Jihad Elkhatib': '지하드 엘카티브',
  'Omar El Jamal': '오마르 엘자말',
  'Wael Arakji': '와엘 아락지',
  'Lucas Saleh': '루카스 살레',
  'Youssef Khayat': '유세프 카얏',
  'Hayk Gyokchyan': '하이크 교크치안',
  'Ali Mezher': '알리 메즈헤르',
  'Karl Zamatta': '카를 자마타',
  'Gerard Hadidian': '제라르 하디디안',
  'Anthony Naba': '안토니 나바',
  'Ali Haidar': '알리 하이다르',
  'Karim Ezzedine': '카림 에제딘',
  'DJ Funderburk': 'DJ 펀더버크(DJ Funderburk)',
};

async function main() {
  const players = await get(`/rest/v1/players?team_id=eq.${LEBANON_TEAM_ID}&select=id,name`);
  for (const p of players) {
    const newName = NAME_MAP[p.name];
    if (!newName) { console.log('SKIP (no mapping):', p.name); continue; }
    await patch(`/rest/v1/players?id=eq.${p.id}`, { name: newName });
    console.log(p.name, '->', newName);
  }

  // Sync best_performer strings inside Lebanon's own schedule.
  const [team] = await get(`/rest/v1/teams?id=eq.${LEBANON_TEAM_ID}&select=extra`);
  const schedule = (team.extra.schedule || []).map((g) => {
    if (!g.best_performer) return g;
    let bp = g.best_performer;
    for (const [en, ko] of Object.entries(NAME_MAP)) {
      const bare = ko.replace(/\([^)]*\)/, ''); // strip "(English)" suffix for naturalized players
      if (bp.includes(en)) bp = bp.replace(en, bare);
    }
    return { ...g, best_performer: bp };
  });
  await patch(`/rest/v1/teams?id=eq.${LEBANON_TEAM_ID}`, { extra: { ...team.extra, schedule } });
  console.log('schedule best_performer strings synced');
}

main().catch((e) => { console.error(e); process.exit(1); });
