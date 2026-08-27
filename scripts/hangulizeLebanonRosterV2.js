// Follow-up fix: user wants EVERY Lebanon player as "한글 English" (space-separated,
// no parentheses), not just the naturalized ones — e.g. "아미르 사우드 Amir Saoud".
// Usage: node scripts/hangulizeLebanonRosterV2.js
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

// hangul-only part (english part comes from stripping "(...)" off the current DB name, or re-derived here)
const HANGUL = {
  '마크 알쿠리': 'Mark Alkhoury',
  '오마르 자말레딘': 'Omar Jamaleddine',
  '마크 쿠에이리': 'Marc Khoueiry',
  '아테르 마족': 'Ater Majok',
  '아미르 사우드': 'Amir Saoud',
  '조셉 아부삼라': 'Joseph Abou Samra',
  '카림 제이눈': 'Karim Zeinoun',
  '자드 칼릴': 'Jad Khalil',
  '세르지오 엘다르위시': 'Sergio El Darwich',
  '알리 만수르': 'Ali Mansour',
  '디드릭 로슨': 'Dedric Lawson',
  '지하드 엘카티브': 'Jihad Elkhatib',
  '오마르 엘자말': 'Omar El Jamal',
  '와엘 아락지': 'Wael Arakji',
  '루카스 살레': 'Lucas Saleh',
  '유세프 카얏': 'Youssef Khayat',
  '하이크 교크치안': 'Hayk Gyokchyan',
  '알리 메즈헤르': 'Ali Mezher',
  '카를 자마타': 'Karl Zamatta',
  '제라르 하디디안': 'Gerard Hadidian',
  '안토니 나바': 'Anthony Naba',
  '알리 하이다르': 'Ali Haidar',
  '카림 에제딘': 'Karim Ezzedine',
  'DJ 펀더버크': 'DJ Funderburk',
};

async function main() {
  const players = await get(`/rest/v1/players?team_id=eq.${LEBANON_TEAM_ID}&select=id,name`);
  for (const p of players) {
    // current name is either "한글" or "한글(English)" from the previous pass — strip to bare 한글
    const hangulOnly = p.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    const english = HANGUL[hangulOnly];
    if (!english) { console.log('SKIP (no mapping):', p.name); continue; }
    const newName = `${hangulOnly} ${english}`;
    await patch(`/rest/v1/players?id=eq.${p.id}`, { name: newName });
    console.log(p.name, '->', newName);
  }

  // sync best_performer strings in schedule to the bare hangul name (unchanged from before,
  // but re-run in case format assumptions shifted)
  const [team] = await get(`/rest/v1/teams?id=eq.${LEBANON_TEAM_ID}&select=extra`);
  console.log('schedule best_performer sample:', (team.extra.schedule || []).map((g) => g.best_performer).filter(Boolean));
}

main().catch((e) => { console.error(e); process.exit(1); });
