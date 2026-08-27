// Converts 이현중/Wael Arakji's international-career record from prose
// player_content (added earlier) into structured stats (stats.NATIONAL_TEAM_BY_YEAR
// / NATIONAL_TEAM_CAREER / CLUB_BY_YEAR / CLUB_CAREER), rendered as real tables
// via PlayerCareerByYear — per user feedback: "그냥 스탯으로 넣어야지" (should be
// entered as actual stats, not prose). Deletes the old prose entries.
//
// Usage:  node scripts/patchCareerAsStats.js
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
const del = (path) => req('DELETE', path, undefined);

const LEE_NATIONAL = [
  { season: 2027, team: '월드컵 아시아 예선', GP: 4, PTS: 24.8, REB: 9.8, AST: 1.5, EFF: 26.5 },
  { season: 2025, team: '아시아컵', GP: 5, PTS: 19.8, REB: 7.6, AST: 3, EFF: 20.6 },
  { season: 2025, team: '아시아컵 예선', GP: 2, PTS: 13, REB: 10, AST: 4.5, EFF: 16 },
  { season: 2021, team: '아시아컵 예선', GP: 4, PTS: 17.3, REB: 7.5, AST: 2, EFF: 23.3 },
  { season: 2021, team: '올림픽 최종예선', GP: 2, PTS: 14.5, REB: 5, AST: 2, EFF: 14.5 },
  { season: 2018, team: 'U18 아시아선수권(청소년)', GP: 6, PTS: 26, REB: 10.3, AST: 6, EFF: 31 },
  { season: 2016, team: 'U17 월드챔피언십(청소년)', GP: 7, PTS: 11.7, REB: 3, AST: 0.7, EFF: 11.4 },
  { season: 2015, team: '아시아 U16 챔피언십(청소년)', GP: 9, PTS: 14, REB: 5.7, AST: 1.6, EFF: 15.4 },
];
const LEE_NATIONAL_CAREER = { PTS: 19.0, REB: 8.1, AST: 2.5, EFF: 21.4 };

const ARAKJI_NATIONAL = [
  { season: 2027, team: '월드컵 아시아 예선', GP: 3, PTS: 19.3, REB: 4.3, AST: 5, EFF: 19.3 },
  { season: 2025, team: '아시아컵 예선', GP: 6, PTS: 20.2, REB: 3.8, AST: 6, EFF: 23.2 },
  { season: 2023, team: '월드컵', GP: 4, PTS: 18, REB: 2.8, AST: 6, EFF: 19.3 },
  { season: 2023, team: '월드컵 아시아 예선', GP: 8, PTS: 16.8, REB: 3.8, AST: 2.8, EFF: 17.5 },
  { season: 2022, team: '아시아컵', GP: 5, PTS: 26, REB: 3.2, AST: 4, EFF: 24.4 },
  { season: 2021, team: '아시아컵 예선', GP: 4, PTS: 19, REB: 2.8, AST: 3.3, EFF: 18.8 },
  { season: 2021, team: '아시아챔피언스컵 GBA 예선', GP: 1, PTS: 17, REB: 8, AST: 4, EFF: 23 },
  { season: 2019, team: '월드컵 아시아 예선', GP: 6, PTS: 16.3, REB: 4.2, AST: 5.7, EFF: 18.3 },
  { season: 2017, team: '아시아컵', GP: 5, PTS: 16.4, REB: 4.4, AST: 3.8, EFF: 18.4 },
  { season: 2017, team: 'WABA 남자 챔피언십', GP: 4, PTS: 10.3, REB: 3.3, AST: 3.3, EFF: 9.5 },
  { season: 2015, team: '아시아 챔피언십', GP: 9, PTS: 9.8, REB: 2.8, AST: 3.6, EFF: 10.7 },
];
const ARAKJI_NATIONAL_CAREER = { PTS: 16.7, REB: 3.6, AST: 4.2, EFF: 17.6 };

const ARAKJI_CLUB = [
  { season: 2026, team: 'FIBA WASL 걸프리그 (Al Ula)', GP: 6, PTS: 29, REB: 5, AST: 7.2, EFF: 30.5 },
  { season: 2025, team: '농구 챔피언스리그 아시아 (Al Riyadi)', GP: 3, PTS: 20.3, REB: 2.3, AST: 5.3, EFF: 24 },
  { season: 2025, team: 'FIBA WASL 파이널8 (Al Riyadi)', GP: 4, PTS: 24.8, REB: 2, AST: 6.3, EFF: 27 },
  { season: 2025, team: 'FIBA WASL 서아시아리그 (Al Riyadi)', GP: 8, PTS: 18.4, REB: 2.9, AST: 6.6, EFF: 22.3 },
  { season: 2024, team: 'FIBA 인터콘티넨탈컵 (Al Riyadi)', GP: 3, PTS: 8, REB: 3, AST: 3.7, EFF: 7 },
  { season: 2024, team: '농구 챔피언스리그 아시아 (Al Riyadi)', GP: 5, PTS: 20.8, REB: 4, AST: 8.4, EFF: 29.2 },
  { season: 2024, team: 'FIBA WASL 파이널8 (Al Riyadi)', GP: 5, PTS: 13.4, REB: 4, AST: 4, EFF: 14.4 },
  { season: 2024, team: 'WASL 서아시아리그 (Al Riyadi)', GP: 10, PTS: 14, REB: 4.8, AST: 7, EFF: 19.1 },
  { season: 2023, team: 'WASL 파이널8 (Al Riyadi)', GP: 2, PTS: 11.5, REB: 2, AST: 4, EFF: 13.5 },
  { season: 2023, team: 'WASL 서아시아리그 (Al Riyadi)', GP: 11, PTS: 17.7, REB: 3.5, AST: 4.7, EFF: 18.1 },
  { season: 2021, team: '농구 아프리카리그 (US Monastir)', GP: 6, PTS: 14.7, REB: 2.3, AST: 3.3, EFF: 17.7 },
  { season: 2019, team: 'FIBA 아시아 챔피언스컵 (Al Riyadi)', GP: 4, PTS: 24.8, REB: 5.3, AST: 3.3, EFF: 23.5 },
  { season: 2018, team: '아시아 챔피언스컵 WABA 예선 (Al Riyadi)', GP: 2, PTS: 7.5, REB: 2, AST: 2.5, EFF: 6 },
  { season: 2017, team: 'FIBA 아시아 챔피언스컵 (Al Riyadi)', GP: 7, PTS: 14.1, REB: 2.7, AST: 5.7, EFF: 17.3 },
  { season: 2016, team: 'FIBA 아시아 챔피언스컵 (Al Riyadi)', GP: 7, PTS: 16.4, REB: 4, AST: 4.7, EFF: 18.7 },
];
const ARAKJI_CLUB_CAREER = { PTS: 17.5, REB: 3.5, AST: 5.4, EFF: 20.0 };

async function patchPlayer(name, extra) {
  const [p] = await get('/rest/v1/players?select=id,name,stats&name=eq.' + encodeURIComponent(name));
  const merged = { ...p.stats, ...extra };
  await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: merged });
  console.log('stats patched', name);
  const contents = await get('/rest/v1/player_content?select=id,title&player_id=eq.' + p.id + '&category=eq.stat_record');
  for (const c of contents) {
    await del('/rest/v1/player_content?id=eq.' + c.id);
    console.log('deleted prose entry:', c.title);
  }
}

async function main() {
  await patchPlayer('이현중', { NATIONAL_TEAM_BY_YEAR: LEE_NATIONAL, NATIONAL_TEAM_CAREER: LEE_NATIONAL_CAREER });
  await patchPlayer('Wael Arakji', {
    NATIONAL_TEAM_BY_YEAR: ARAKJI_NATIONAL, NATIONAL_TEAM_CAREER: ARAKJI_NATIONAL_CAREER,
    CLUB_BY_YEAR: ARAKJI_CLUB, CLUB_CAREER: ARAKJI_CLUB_CAREER,
  });
}

main().catch((e) => { console.error(e); process.exit(1); });
