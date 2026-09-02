// Repurposes the bball_nt_w sport-listing page (/bball_nt_w) from the March
// Qualifying Tournament summary into the actual 2026 FIBA Women's Basketball
// World Cup (Berlin, 9/4~13) hub page: title override, B-group standings
// (Korea/Hungary/Nigeria/France, pre-tournament 0-0-0 per FIBA's own
// standings page) with team links (internal where we have a team page,
// external FIBA link for Hungary since we don't yet), A/C/D groups as
// external-link-only lists (rosters not out yet), and every news item listed
// on FIBA's tournament hub page as "월드컵 주요 뉴스".
// The March Qualifying Tournament's own standings/history are NOT lost — they
// stay fully documented in the team's own memo/schedule (see
// updateWomenTeamToWorldCupRoster.js); this only changes what the top-level
// listing page leads with.
// Usage: node scripts/setWorldCupListingPage.js
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
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const d = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode >= 400) return reject(new Error(`${method} ${path} -> ${res.statusCode}: ${d}`));
        try { resolve(d ? JSON.parse(d) : null); } catch { resolve(d); }
      });
    });
    r.on('error', reject); if (payload) r.write(payload); r.end();
  });
}
const get = (path) => req('GET', path);
const patch = (path, body) => req('PATCH', path, body);

const KOR_TEAM_ID = '498d9fbb-cdb2-4d21-941d-23fc1414d84d';
const FRA_TEAM_ID = '8d0a2119-ed62-4b6c-86b4-45c9463f9548';
const NGR_TEAM_ID = '9f4626ee-7891-4fd3-be6c-040bc0deb5e7';
const TB = 'https://www.fiba.basketball/en/events/fiba-womens-basketball-world-cup-2026/teams/';

const GROUP_B_STANDINGS = [
  { rank: 1, code: 'HUN', name_ko: '헝가리', wins: 0, losses: 0, points: 0, team_url: TB + 'hungary', team_url_external: true },
  { rank: 2, code: 'KOR', name_ko: '대한민국', wins: 0, losses: 0, points: 0, team_url: `/bball_nt_w/teams/${KOR_TEAM_ID}` },
  { rank: 3, code: 'NGR', name_ko: '나이지리아', wins: 0, losses: 0, points: 0, team_url: `/bball_nt_w/teams/${NGR_TEAM_ID}` },
  { rank: 4, code: 'FRA', name_ko: '프랑스', wins: 0, losses: 0, points: 0, team_url: `/bball_nt_w/teams/${FRA_TEAM_ID}` },
];

const OTHER_GROUPS = [
  { group: 'A', teams: [
    { code: 'JPN', name_ko: '일본', url: TB + 'japan' },
    { code: 'ESP', name_ko: '스페인', url: TB + 'spain' },
    { code: 'GER', name_ko: '독일', url: TB + 'germany' },
    { code: 'MLI', name_ko: '말리', url: TB + 'mali' },
  ] },
  { group: 'C', teams: [
    { code: 'BEL', name_ko: '벨기에', url: TB + 'belgium' },
    { code: 'AUS', name_ko: '호주', url: TB + 'australia' },
    { code: 'PUR', name_ko: '푸에르토리코', url: TB + 'puerto-rico' },
    { code: 'TUR', name_ko: '튀르키예', url: TB + 'turkiye' },
  ] },
  { group: 'D', teams: [
    { code: 'USA', name_ko: '미국', url: TB + 'usa' },
    { code: 'CZE', name_ko: '체코', url: TB + 'czechia' },
    { code: 'ITA', name_ko: '이탈리아', url: TB + 'italy' },
    { code: 'CHN', name_ko: '중국', url: TB + 'china' },
  ] },
];

const NB = 'https://www.fiba.basketball/en/events/fiba-womens-basketball-world-cup-2026/news/';
const WC_NEWS = [
  {
    title: '10 Rising stars ready to light up the Women\'s World Cup', date: '2026-08-28', url: NB + '10-rising-stars-ready-to-light-up-the-womens-world-cup',
    summary: '2004년 이후 출생한 유망주 10인을 소개하는 기사.',
    full_summary: '2004년 이후 태어난 차세대 스타 10명을 소개하는 기사. 프랑스의 도미니크 말롱가, 스페인의 아와 팜, 중국의 지위 장, 독일의 프리다 뷔너 등이 포함되며 각 선수의 신체 조건과 커리어, 향후 활약 전망을 다룬다. 한국 선수는 언급되지 않았다.',
  },
  {
    title: 'Frontrunners France name final roster for Berlin', date: '2026-08-29', url: NB + 'frontrunners-france-name-final-roster-for-berlin',
    summary: '프랑스가 베를린 월드컵 최종 로스터를 발표, 사상 첫 메달을 노린다.',
    full_summary: '프랑스가 2026 FIBA 여자농구 월드컵에 나설 최종 로스터를 발표했다. 2024 파리올림픽 은메달의 여세를 몰아 1953년 첫 대회 참가 이후 한 번도 따내지 못한 월드컵 메달 획득을 목표로 한다. 가비 윌리엄스, 마린 조아네스 등 기존 주축 선수들과 신예 도미니크 말롱가가 핵심 전력으로 꼽힌다.',
  },
  {
    title: "Choose your hero: Who's the biggest star heading to the Women's World Cup", date: '2026-08-30', url: NB + 'choose-your-hero-whos-the-biggest-star-heading-to-the-womens-world-cup',
    summary: '16개국 대표 스타 중 최고의 스타를 뽑는 팬 투표.',
    full_summary: 'FIBA가 베를린 월드컵을 앞두고 진행하는 팬 투표 콘텐츠. 참가 16개국에서 한 명씩 선정된 스타 선수 중 대회 개막을 앞두고 가장 기대되는 선수가 누구인지 팬들이 직접 투표로 고르는 이벤트다.',
  },
  {
    title: "10 Women's World Cup debutantes set to shine", date: '2026-08-31', url: NB + '10-womens-world-cup-debutantes-set-to-shine',
    summary: '월드컵 첫 출전을 앞둔 주목할 만한 신인 10인을 소개.',
    full_summary: '2026 베를린 월드컵에 처음 출전하는 주목할 만한 선수 10명을 소개하는 기사. 클로이 클락과 나페사 콜리어(이상 미국), 자넬 살롱(프랑스) 등이 포함되며, 각국을 대표할 핵심 자원으로 소개된다. 한국 선수는 언급되지 않았다.',
  },
  {
    title: 'Spain looking ready for a podium push', date: '2026-08-31', url: NB + 'spain-looking-ready-for-a-podium-push',
    summary: '스페인, 베테랑과 유망주 조화로 메달 획득 노려.',
    full_summary: '스페인이 경험 많은 베테랑과 젊은 유망주의 조화를 앞세워 베를린에서 메달권 진입을 노린다는 기사. 신인 아와 팜, 이야나 마틴과 베테랑 메간 구스타프손, 알바 토렌스가 조화를 이루며, 조별리그에서 독일·말리·일본과 맞붙는다.',
  },
  {
    title: "Sonia Citron, Kiki Iriafen join USA's star-studded cast for Berlin", date: '2026-08-31', url: NB + 'sonia-citron-kiki-iriafen-join-usas-star-studded-cast-for-berlin',
    summary: '미국, 부상자 대체로 시트론·이리아펜 추가 소집.',
    full_summary: '미국 대표팀이 건강 문제로 낙마한 켈시 플럼과 에이자 윌슨을 대신해 소냐 시트론과 키키 이리아펜을 새로 소집했다. 9명의 월드컵 데뷔 선수를 포함하고도 여전히 압도적인 전력을 보유하고 있으며, 9월 4일 중국전을 시작으로 5연패 달성에 도전한다.',
  },
  {
    title: 'MVP Ladder Volume 1: Who are the frontrunners?', date: '2026-08-31', url: NB + 'mvp-ladder-volume-1-who-are-the-frontrunners',
    summary: 'TISSOT MVP 수상 후보 10인을 순위별로 분석.',
    full_summary: '누가 이번 대회 TISSOT MVP를 거머쥘지 예상하는 랭킹 기사. 1위 브레아나 스튜어트(미국)부터 10위 페이지 부에커스(미국)까지 총 10명의 후보를 선정했으며, 메달 획득 가능성이 높은 강호의 스타 선수들이 상위권을 차지했다.',
  },
  {
    title: "Women's World Cup Smart Power Rankings; Volume 4", date: '2026-09-01', url: NB + 'womens-world-cup-smart-power-rankings-volume-4',
    summary: '개막 직전 파워랭킹 발표, 한국은 13위 — 박지수 공백 언급.',
    full_summary: 'FIBA가 개막 직전 발표한 파워랭킹에서 미국 1위, 프랑스 2위, 스페인 3위를 차지했다. 한국은 13위로 평가됐으며, 기사는 "주전 센터 박지수의 부상 공백을 겪고 있으며 강이슬과 박지현에게 거는 기대가 크다"고 짚었다.',
  },
  {
    title: 'Malonga ready to throw down World Cup dunk', date: '2026-09-01', url: NB + 'malonga-ready-to-throw-down-world-cup-dunk',
    summary: '프랑스 신예 말롱가, 첫 월드컵서 덩크 예고.',
    full_summary: '프랑스의 20세 유망주 도미니크 말롱가가 베를린에서 열릴 자신의 첫 월드컵에서 임팩트 있는 플레이를 재현할 준비가 됐다고 밝혔다. 지난 3월 예선전 홈팬들 앞에서 보여줬던 것과 같은 화려한 플레이를 다시 보여주고 싶다는 포부를 전했다.',
  },
  {
    title: 'Juhasz ready to carry the hopes of a nation', date: '2026-09-01', url: NB + 'juhasz-ready-to-carry-the-hopes-of-a-nation',
    summary: '28년 만에 월드컵 복귀하는 헝가리, 유하즈가 이끈다.',
    full_summary: '헝가리의 센터 도르카 유하즈가 1998년 이후 28년 만에 월드컵 무대를 밟는 조국의 기대를 짊어지고 있다. 파리올림픽과 유로바스켓에서의 탈락을 발판 삼아 팀 농구를 강조하며 베를린에서 헝가리를 이끌겠다는 각오를 밝혔다. 헝가리는 한국이 속한 B조에서 시드 1번을 배정받았다.',
  },
  {
    title: 'Roster Tracker: FIBA Women\'s Basketball World Cup 2026', date: '2026-05-18', url: NB + 'roster-tracker-fiba-womens-basketball-world-cup-2026',
    summary: '참가 16개국의 로스터 발표 현황을 실시간 정리.',
    full_summary: '2026 FIBA 여자농구 월드컵에 참가하는 16개국이 각각 예비·최종 로스터를 발표하는 상황을 실시간으로 정리한 기사. 대한민국의 최종 로스터(허예은·안혜지·최이샘·홍유순 등 12인) 발표 내용도 이 기사를 통해 반영됐다.',
  },
];

async function main() {
  const [team] = await get(`/rest/v1/teams?id=eq.${KOR_TEAM_ID}&select=extra`);
  const extra = {
    ...team.extra,
    title_override: '2026 FIBA 베를린 여자농구 월드컵',
    group: 'B',
    group_standings: GROUP_B_STANDINGS,
    other_groups: OTHER_GROUPS,
    news_heading: '월드컵 주요 뉴스',
    group_news: [...WC_NEWS].sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
  await patch(`/rest/v1/teams?id=eq.${KOR_TEAM_ID}`, { extra });
  console.log('done');
}

main().catch((e) => { console.error(e); process.exit(1); });
