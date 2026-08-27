// Adds 이현중's full FIBA national-team career-by-year record (senior + youth,
// back to 2015) to player_content — reference material for the broadcaster.
// Source: https://www.fiba.basketball/en/players/222098-hyunjung-lee (already
// scraped earlier in this session).
//
// Usage:  node scripts/patchLeeCareerRecord.js
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
const post = (path, body) => req('POST', path, body);

const BODY = `대표팀(성인) 대회별 평균 기록
- 2027 FIBA 월드컵 아시아 예선: 4경기 24.8득점 9.8리바운드 1.5어시스트 (EFF 26.5)
- 2025 FIBA 아시아컵: 5경기 19.8득점 7.6리바운드 3.0어시스트 (EFF 20.6)
- 2025 FIBA 아시아컵 예선: 2경기 13.0득점 10.0리바운드 4.5어시스트 (EFF 16.0)
- 2021 FIBA 아시아컵 예선: 4경기 17.3득점 7.5리바운드 2.0어시스트 (EFF 23.3)
- 2021 올림픽 최종예선(리투아니아 카우나스): 2경기 14.5득점 5.0리바운드 2.0어시스트 (EFF 14.5)
통산 평균: 19.0득점 8.1리바운드 2.5어시스트 (EFF 21.4)

청소년 대표팀 대회별 평균 기록
- 2018 FIBA U18 아시아선수권: 6경기 26.0득점 10.3리바운드 6.0어시스트 (EFF 31.0)
- 2016 FIBA U17 월드챔피언십: 7경기 11.7득점 3.0리바운드 0.7어시스트 (EFF 11.4)
- 2015 FIBA 아시아 U16 챔피언십: 9경기 14.0득점 5.7리바운드 1.6어시스트 (EFF 15.4)
통산 평균: 16.5득점 6.1리바운드 2.5어시스트 (EFF 18.4)`;

async function main() {
  const [lee] = await get('/rest/v1/players?select=id,name&name=eq.' + encodeURIComponent('이현중'));
  await post('/rest/v1/player_content', {
    player_id: lee.id,
    category: 'stat_record',
    title: '역대 국제대회 기록 (2015~)',
    body: BODY,
    source_urls: ['https://www.fiba.basketball/en/players/222098-hyunjung-lee'],
  });
  console.log('added career record for', lee.name);
}

main().catch((e) => { console.error(e); process.exit(1); });
