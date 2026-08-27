// Adds Wael Arakji's full FIBA national-team + club-competition career-by-year
// record (2015~2026) to player_content. Source: his general FIBA player page
// (already scraped this session).
//
// Usage:  node scripts/patchArakjiCareerRecord.js
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
- 2027 FIBA 월드컵 아시아 예선: 3경기 19.3득점 4.3리바운드 5.0어시스트 (EFF 19.3)
- 2025 FIBA 아시아컵 예선: 6경기 20.2득점 3.8리바운드 6.0어시스트 (EFF 23.2)
- 2023 FIBA 월드컵: 4경기 18.0득점 2.8리바운드 6.0어시스트 (EFF 19.3)
- 2023 FIBA 월드컵 아시아 예선: 8경기 16.8득점 3.8리바운드 2.8어시스트 (EFF 17.5)
- 2022 FIBA 아시아컵: 5경기 26.0득점 3.2리바운드 4.0어시스트 (EFF 24.4)
- 2021 FIBA 아시아컵 예선: 4경기 19.0득점 2.8리바운드 3.3어시스트 (EFF 18.8)
- 2021 FIBA 아시아챔피언스컵 GBA 예선: 1경기 17.0득점 8.0리바운드 4.0어시스트 (EFF 23.0)
- 2019 FIBA 월드컵 아시아 예선: 6경기 16.3득점 4.2리바운드 5.7어시스트 (EFF 18.3)
- 2017 FIBA 아시아컵: 5경기 16.4득점 4.4리바운드 3.8어시스트 (EFF 18.4)
- 2017 WABA 남자 챔피언십: 4경기 10.3득점 3.3리바운드 3.3어시스트 (EFF 9.5)
- 2015 FIBA 아시아 챔피언십: 9경기 9.8득점 2.8리바운드 3.6어시스트 (EFF 10.7)
통산 평균: 16.7득점 3.6리바운드 4.2어시스트 (EFF 17.6)

소속팀(알 리야디 등) 클럽대회 대회별 평균 기록
- 2026 FIBA WASL 걸프리그(Al Ula): 6경기 29.0득점 5.0리바운드 7.2어시스트 (EFF 30.5)
- 2025 농구 챔피언스리그 아시아(Al Riyadi): 3경기 20.3득점 2.3리바운드 5.3어시스트 (EFF 24.0)
- 2025 FIBA WASL 파이널8(Al Riyadi): 4경기 24.8득점 2.0리바운드 6.3어시스트 (EFF 27.0)
- 2025 FIBA WASL 서아시아리그(Al Riyadi): 8경기 18.4득점 2.9리바운드 6.6어시스트 (EFF 22.3)
- 2024 FIBA 인터콘티넨탈컵(Al Riyadi): 3경기 8.0득점 3.0리바운드 3.7어시스트 (EFF 7.0)
- 2024 농구 챔피언스리그 아시아(Al Riyadi): 5경기 20.8득점 4.0리바운드 8.4어시스트 (EFF 29.2)
- 2024 FIBA WASL 파이널8(Al Riyadi): 5경기 13.4득점 4.0리바운드 4.0어시스트 (EFF 14.4)
- 2024 WASL 서아시아리그(Al Riyadi): 10경기 14.0득점 4.8리바운드 7.0어시스트 (EFF 19.1)
- 2023 WASL 파이널8(Al Riyadi): 2경기 11.5득점 2.0리바운드 4.0어시스트 (EFF 13.5)
- 2023 WASL 서아시아리그(Al Riyadi): 11경기 17.7득점 3.5리바운드 4.7어시스트 (EFF 18.1)
- 2021 농구 아프리카리그 시즌1(US Monastir): 6경기 14.7득점 2.3리바운드 3.3어시스트 (EFF 17.7)
- 2019 FIBA 아시아 챔피언스컵(Al Riyadi): 4경기 24.8득점 5.3리바운드 3.3어시스트 (EFF 23.5)
- 2018 FIBA 아시아 챔피언스컵 WABA 예선(Al Riyadi): 2경기 7.5득점 2.0리바운드 2.5어시스트 (EFF 6.0)
- 2017 FIBA 아시아 챔피언스컵(Al Riyadi): 7경기 14.1득점 2.7리바운드 5.7어시스트 (EFF 17.3)
- 2016 FIBA 아시아 챔피언스컵(Al Riyadi): 7경기 16.4득점 4.0리바운드 4.7어시스트 (EFF 18.7)
통산 평균: 17.5득점 3.5리바운드 5.4어시스트 (EFF 20.0)`;

async function main() {
  const [player] = await get('/rest/v1/players?select=id,name&name=eq.' + encodeURIComponent('Wael Arakji'));
  await post('/rest/v1/player_content', {
    player_id: player.id,
    category: 'stat_record',
    title: '역대 국제대회·클럽대회 기록 (2015~)',
    body: BODY,
    source_urls: ['https://www.fiba.basketball/en/players/217230-wael-arakji'],
  });
  console.log('added career record for', player.name);
}

main().catch((e) => { console.error(e); process.exit(1); });
