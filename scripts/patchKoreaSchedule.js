// Adds 1·2라운드 schedule/results to 대한민국 team's `extra.schedule` — home shown
// as opponent code, away as "@CODE", finished games carry score + best performer
// (highest EFF among our 12-man roster that game, per stats.GAME_LOG already on
// each player). Cross-checked against F조 standings (3승3패) — matches exactly.
//
// Usage:  node scripts/patchKoreaSchedule.js
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
    round: '1라운드', opponent_code: 'CHN', opponent_name: '중국', home: false,
    date: '2025-11-28', venue: 'Beijing, Wukesong Sport Arena (중국)',
    status: 'finished', score_for: 80, score_against: 76, result: 'W',
    best_performer: '이현중 33득점 14리바운드 (EFF 37)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126934-CHN-KOR',
  },
  {
    round: '1라운드', opponent_code: 'CHN', opponent_name: '중국', home: true,
    date: '2025-12-01', venue: '대한민국',
    status: 'finished', score_for: 90, score_against: 76, result: 'W',
    best_performer: '이정현 24득점 4어시스트 (EFF 26)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126932-KOR-CHN',
  },
  {
    round: '1라운드', opponent_code: 'TPE', opponent_name: '대만', home: false,
    date: '2026-02-26', venue: '대만',
    status: 'finished', score_for: 65, score_against: 77, result: 'L',
    best_performer: '이현중 18득점 8리바운드 (EFF 15)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126929-TPE-KOR',
  },
  {
    round: '1라운드', opponent_code: 'JPN', opponent_name: '일본', home: false,
    date: '2026-03-01', venue: '일본',
    status: 'finished', score_for: 72, score_against: 78, result: 'L',
    best_performer: '이현중 28득점 11리바운드 (EFF 31)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126928-JPN-KOR',
  },
  {
    round: '1라운드', opponent_code: 'TPE', opponent_name: '대만', home: true,
    date: '2026-07-03', venue: '대한민국', note: '연장(OT)',
    status: 'finished', score_for: 80, score_against: 82, result: 'L',
    best_performer: '이우석 12득점 6리바운드 7어시스트 (EFF 15)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126924-KOR-TPE',
  },
  {
    round: '1라운드', opponent_code: 'JPN', opponent_name: '일본', home: true,
    date: '2026-07-06', venue: '대한민국',
    status: 'finished', score_for: 81, score_against: 79, result: 'W',
    best_performer: '이우석 19득점 7리바운드 (EFF 17)',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126923-KOR-JPN',
  },
  // 2라운드: F조 재편성 후 아직 안 붙어본 3개국(레바논/카타르/사우디)과 홈&어웨이로 재대결.
  // 윈도우5·6(11월, 2·3월) 경기는 날짜만 확정, 구장·시간은 아직 미정(FIBA 발표 대기).
  {
    round: '2라운드', opponent_code: 'LBN', opponent_name: '레바논', home: false,
    date: '2026-08-28', venue: 'Zouk Mikael (레바논)', note: '한국시간 03:00',
    status: 'scheduled',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126968-LBN-KOR',
  },
  {
    round: '2라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: true,
    date: '2026-08-31', venue: '수원 (대한민국)', note: '시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'QAT', opponent_name: '카타르', home: false,
    date: '2026-11-26', venue: '미정', note: '구장·시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: false,
    date: '2026-11-29', venue: '미정', note: '구장·시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'LBN', opponent_name: '레바논', home: true,
    date: '2027-02-26', venue: '미정 (대한민국)', note: '구장·시간 미정',
    status: 'scheduled',
  },
  {
    round: '2라운드', opponent_code: 'QAT', opponent_name: '카타르', home: true,
    date: '2027-03-01', venue: '미정 (대한민국)', note: '구장·시간 미정',
    status: 'scheduled',
  },
];

async function main() {
  const [team] = await get('/rest/v1/teams?select=id,name,extra&name=eq.' + encodeURIComponent('대한민국 남자농구 국가대표팀'));
  const extra = { ...team.extra, schedule: SCHEDULE };
  await patch(`/rest/v1/teams?id=eq.${team.id}`, { extra });
  console.log('patched', team.name, SCHEDULE.length, 'games');
}

main().catch((e) => { console.error(e); process.exit(1); });
