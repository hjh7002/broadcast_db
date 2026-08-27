// Adds 1·2라운드 schedule/results to 레바논 team's `extra.schedule` (same shape
// as scripts/patchKoreaSchedule.js). Best performer = Lebanon's Efficiency
// leader from each game's "Game Leaders" widget (not a full player game log,
// which wasn't scraped for Lebanon's 24-man roster).
//
// Usage:  node scripts/patchLebanonSchedule.js
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

const SCHEDULE = [
  {
    round: '1라운드', opponent_code: 'QAT', opponent_name: '카타르', home: false,
    date: '2025-11-28', venue: 'Doha, Lusail Multipurpose Hall (카타르)',
    status: 'finished', score_for: 75, score_against: 74, result: 'W',
    best_performer: 'Dedric Lawson (EFF 17)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126952-QAT-LBN',
  },
  {
    round: '1라운드', opponent_code: 'QAT', opponent_name: '카타르', home: true,
    date: '2025-12-01', venue: '레바논',
    status: 'finished', score_for: 83, score_against: 86, result: 'L',
    best_performer: 'Wael Arakji (EFF 24)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126950-LBN-QAT',
  },
  {
    round: '1라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: true,
    date: '2026-02-28', venue: '레바논',
    status: 'finished', score_for: 94, score_against: 64, result: 'W',
    best_performer: 'Dedric Lawson (EFF 31)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126954-LBN-KSA',
  },
  {
    round: '1라운드', opponent_code: 'IND', opponent_name: '인도', home: true,
    date: '2026-06-30', venue: '레바논',
    status: 'finished', score_for: 99, score_against: 56, result: 'W',
    best_performer: 'Jihad Elkhatib (EFF 20)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126958-LBN-IND',
  },
  {
    round: '1라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: false,
    date: '2026-07-03', venue: 'Jeddah, King Abdullah Sports City (사우디아라비아)',
    status: 'finished', score_for: 88, score_against: 82, result: 'W',
    best_performer: 'Amir Saoud (EFF 26)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126956-KSA-LBN',
  },
  {
    round: '1라운드', opponent_code: 'IND', opponent_name: '인도', home: false,
    date: '2026-07-06', venue: 'Ahmedabad, Veer Savarkar Indoor Stadium (인도)',
    status: 'finished', score_for: 98, score_against: 72, result: 'W',
    best_performer: 'Ali Mezher (EFF 29)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126947-IND-LBN',
  },
  // 2라운드: F조 재편성 후 아직 안 붙어본 3개국(한국/일본/중국)과 홈&어웨이 재대결.
  {
    round: '2라운드', opponent_code: 'KOR', opponent_name: '한국', home: true,
    date: '2026-08-28', venue: 'Zouk Mikael (레바논)', note: '한국시간 03:00',
    status: 'scheduled',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126968-LBN-KOR',
  },
  {
    round: '2라운드', opponent_code: 'CHN', opponent_name: '중국', home: false,
    date: '2026-08-31', venue: '주지, 중국', note: '시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'JPN', opponent_name: '일본', home: true,
    date: '2026-11-26', venue: '미정 (레바논)', note: '구장·시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'CHN', opponent_name: '중국', home: true,
    date: '2026-11-29', venue: '미정 (레바논)', note: '구장·시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'KOR', opponent_name: '한국', home: false,
    date: '2027-02-26', venue: '미정 (대한민국)', note: '구장·시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'JPN', opponent_name: '일본', home: false,
    date: '2027-03-01', venue: '미정 (일본)', note: '구장·시간 미정',
    status: 'scheduled',
  },
];

async function main() {
  const [team] = await get('/rest/v1/teams?select=id,name,extra&name=eq.' + encodeURIComponent('레바논 남자농구 국가대표팀'));
  const extra = { ...team.extra, schedule: SCHEDULE };
  await patch(`/rest/v1/teams?id=eq.${team.id}`, { extra });
  console.log('patched', team.name, SCHEDULE.length, 'games');
}

main().catch((e) => { console.error(e); process.exit(1); });
