// Adds F조 (Group F) standings + general Asian-Qualifiers-window news to the
// bball_nt sport's team rows' `extra` jsonb (no schema change needed — reuses
// the existing `extra` column that already holds {competition, group}).
// The [sportCode]/page.tsx sport page reads this off whichever team has it.
//
// Usage:  node scripts/patchGroupFStandingsNews.js
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

const GROUP_STANDINGS = [
  { rank: 1, code: 'LBN', name_ko: '레바논', wins: 5, losses: 1, points: 11 },
  { rank: 2, code: 'JPN', name_ko: '일본', wins: 4, losses: 2, points: 10 },
  { rank: 3, code: 'QAT', name_ko: '카타르', wins: 4, losses: 2, points: 10 },
  { rank: 4, code: 'KOR', name_ko: '한국', wins: 3, losses: 3, points: 9 },
  { rank: 5, code: 'CHN', name_ko: '중국', wins: 3, losses: 3, points: 9 },
  { rank: 6, code: 'KSA', name_ko: '사우디아라비아', wins: 3, losses: 3, points: 9 },
];

const GROUP_NEWS = [
  {
    title: '윈도우4 주목할 7경기 — 레바논 vs 한국 포함',
    date: '2026-08-15',
    url: 'https://www.fiba.basketball/en/news/games-you-should-not-miss-in-window-4-of-the-asian-qualifiers',
    summary:
      '한국-레바논전이 8/27 21:00(현지) 레바논 Zouk Mikael에서 열린다. 한국이 최근 맞대결 3연승 중(2025 아시아컵 97-86 승리 포함)이지만, 레바논이 자국에서 설욕을 노리는 라이벌전으로 소개됐다. 이 밖에 카타르-중국, 이란-뉴질랜드전도 주요 매치업으로 꼽혔다.',
  },
  {
    title: '아시아 예선 파워랭킹 Vol.7',
    date: '2026-08-20',
    url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/fiba-basketball-world-cup-2027-asian-qualifiers-smart-power-rankings-volume-7',
    summary:
      '한국은 12개 팀 중 10위(3승3패)로 한 계단 하락. 에이스 이현중의 출전 여부가 불투명하고, 지난 일본전 승리 주역이었던 최준용은 7월 NBA 진출을 위해 국가대표팀을 떠난다고 발표했다. 최근 도쿄 평가전에서 일본에 2연패하며 전력 공백이 드러났다는 평가.',
  },
  {
    title: '8월 아시아 예선 주목할 선수 10인',
    date: '2026-08-21',
    url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/10-players-to-watch-in-the-asian-qualifiers-this-august',
    summary:
      '2라운드를 앞두고 주목할 선수 10인 중 레바논 알리 메즈헤르가 포함됐다 — 직전 윈도우 한 경기 15어시스트로 대회 신기록을 세웠으며, 이번엔 빠른 발을 앞세운 한국 백코트를 상대해야 하는 최대 시험대에 오른다고 소개. 일본 하치무라 루이·가와무라 유키, 중국 양한선(216cm 센터), 필리핀 저스틴 브라운리도 이름을 올렸다.',
  },
  {
    title: '윈도우4 데뷔·복귀 예상 선수 (레바논 DJ Funderburk 등)',
    date: '2026-08-22',
    url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/debutants-and-returning-players-to-watch-in-window-4',
    summary:
      '레바논은 208cm 빅맨 DJ 펀더버크(유럽 프로리그 경력)의 국가대표 데뷔가 유력하며, 한국·중국 등 강팀을 상대할 골밑 자원으로 기대를 모은다고 소개. 일본은 NBA 경험의 가와무라 유키가 복귀하고, 호주는 NCAA에서 활약한 맥스웰 매키넌이 새 얼굴로 언급됐다.',
  },
  {
    title: '윈도우4 경기장·킥오프 시간 확정',
    date: '2026-08-04',
    url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/venues-tip-off-times-locked-in-for-window-4-of-asian-qualifiers',
    summary:
      '2라운드(윈도우4)는 8/27~31 진행되며 F조(카타르·레바논·일본·한국·중국·사우디)는 홈&어웨이 방식으로 치러진다. 1라운드 성적이 그대로 승계되고, 각 조 상위 3팀 + 개최국 카타르까지 총 7개국이 2027 월드컵 본선에 진출한다.',
  },
  {
    title: '윈도우4 출전 로스터 트래커',
    date: '2026-07-21',
    url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/asian-qualifiers-roster-tracker-who-will-play-in-window-4',
    summary:
      '각국이 윈도우4를 앞두고 예비·최종 로스터를 순차 발표하는 내용을 실시간으로 정리한 기사. 한국 최종 로스터(이정현·문유현·변준형 등 12인)도 이 기사를 통해 공개됐다 — 지금 우리 대표팀 페이지에 반영한 명단과 동일하다.',
  },
];

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const teams = await get(`/rest/v1/teams?sport_id=eq.${sport.id}&select=id,name,extra`);
  for (const t of teams) {
    const extra = { ...t.extra, group_standings: GROUP_STANDINGS, group_news: GROUP_NEWS };
    await patch(`/rest/v1/teams?id=eq.${t.id}`, { extra });
    console.log('patched', t.name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
