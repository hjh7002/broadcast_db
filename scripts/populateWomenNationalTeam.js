// Builds out the new bball_nt_w (여자 국가대표) sport: creates the Korea team
// row and its 12-player World Cup Qualifying Tournament roster, sourced from
// the user's Notion roster page + verified/enriched against FIBA's official
// team stats (fiba.basketball .../teams/korea, Statistics tab) for the
// 2026 FIBA Women's Basketball World Cup Qualifying Tournament (Villeurbanne,
// France, 2026-03-11~18). Korea finished 3-2 (3rd in a 6-team group) and
// qualified for the 2026 World Cup in Berlin.
// Usage: node scripts/populateWomenNationalTeam.js
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
const post = (path, body) => req('POST', path, body);

const SPORT_ID = '10f7ec62-38a4-44b2-8918-141941c5191f'; // bball_nt_w

const GAME_URL_BASE = 'https://www.fiba.basketball/en/events/fiba-womens-basketball-world-cup-2026-qualifying-tournament-villeurbanne-france/games/';

const TEAM_EXTRA = {
  competition: 'FIBA Women\'s Basketball World Cup 2026 Qualifying Tournament (Villeurbanne, France)',
  group: 'A',
  coaching_staff: [
    { name: '박수호', role: '감독', since: '2024-05' },
    { name: '양지희', role: '코치' },
  ],
  schedule: [
    {
      date: '2026-03-12', home: false, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)',
      result: 'L', status: 'finished', score_for: 49, score_against: 76,
      opponent_code: 'GER', opponent_name: '독일', source_url: GAME_URL_BASE + '128158-GER-KOR',
    },
    {
      date: '2026-03-12', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)',
      note: '독일전 종료 후 연전', result: 'W', status: 'finished', score_for: 77, score_against: 60,
      opponent_code: 'NGR', opponent_name: '나이지리아', source_url: GAME_URL_BASE + '128160-KOR-NGR',
    },
    {
      date: '2026-03-15', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)',
      note: '백투백 1차전', result: 'W', status: 'finished', score_for: 82, score_against: 52,
      opponent_code: 'COL', opponent_name: '콜롬비아', source_url: GAME_URL_BASE + '128162-KOR-COL',
    },
    {
      date: '2026-03-15', home: false, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)',
      note: '백투백 2차전. 강이슬 3점 8개(24득점)로 이 경기 승리 후 본선行 확정', result: 'W', status: 'finished', score_for: 105, score_against: 74,
      opponent_code: 'PHI', opponent_name: '필리핀', source_url: GAME_URL_BASE + '128166-PHI-KOR',
      best_performer: '강이슬 24득점 3점 8개 (TCL Player of the Game)',
    },
    {
      date: '2026-03-18', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)',
      note: '조별리그 최종전 (이미 본선 진출 확정 후 경기)', result: 'L', status: 'finished', score_for: 62, score_against: 89,
      opponent_code: 'FRA', opponent_name: '프랑스', source_url: GAME_URL_BASE + '128170-KOR-FRA',
    },
  ],
  group_standings: [
    { code: 'FRA', rank: 1, wins: 5, losses: 0, name_ko: '프랑스' },
    { code: 'GER', rank: 2, wins: 4, losses: 1, name_ko: '독일' },
    { code: 'KOR', rank: 3, wins: 3, losses: 2, name_ko: '대한민국' },
    { code: 'NGR', rank: 4, wins: 2, losses: 3, name_ko: '나이지리아' },
    { code: 'PHI', rank: 5, wins: 1, losses: 4, name_ko: '필리핀' },
    { code: 'COL', rank: 6, wins: 0, losses: 5, name_ko: '콜롬비아' },
  ],
  memo:
    '감독 박수호(2024년 5월 첫 부임), 코치 양지희.\n' +
    '2025년 7월 여자 아시아컵 4위(23년 사상 최초 4강 탈락 이후 4년 만에 4강 복귀) 자격으로 월드컵 최종예선(프랑스 리옹-빌뢰르반, A조) 참가.\n' +
    '조 편성: 대한민국·프랑스·독일·나이지리아·콜롬비아·필리핀(6개팀 중 상위 4팀이 2026 월드컵 본선 진출. 독일은 개최국, 나이지리아는 아프로바스켓 우승팀 자격으로 이미 본선行 확정된 상태에서 참가).\n' +
    '최종 성적 3승2패(조 3위)로 2026 FIBA 여자농구 월드컵(9/4~13, 독일 베를린) 본선 진출 확정 — 17회 연속 월드컵 본선 진출(1964년 페루 대회부터 한 번도 거르지 않음, 미국 다음으로 긴 기록). 역대 최고 성적은 준우승 2회(1967 체코, 1979 한국).\n' +
    '전술: 모션 오펜스(패스 중심, 픽앤롤 빈도 낮음) + 갭 디펜스, 트랜지션 게임.\n' +
    '아시아컵 대비 변화 IN: 이소희·박소희·진안 / OUT: 신지현·이명관·이주연.\n' +
    '독일전(1차전) 49-76 패 — 팀 야투 25.7%(주전 33% / 벤치 10.8%), 리바운드 33-55 열세(전반 15-33 열세, 3쿼터는 13-8로 앞서며 유일하게 쿼터 득점 우세).\n' +
    '강이슬이 필리핀전에서 3점 8개(24득점)를 몰아넣으며 최종예선 평균 18.6점으로 팀 내 최다득점, 박지수는 대회 내내 더블더블을 노리는 골밑 활약(평균 8.4점/6.6리바/2.0블록).',
};

const PLAYERS = [
  {
    jersey_number: 1, name: '박지현 Jihyun Park', position: '가드',
    bio: { height_cm: 185, birthdate: '2000-04-07', club: '토코마나와 퀸즈(NZL)',
      memo: '국대 경력: 2018~ (도쿄 올림픽, 아시아컵). 2025 아시아컵 베스트5, 해외리그(뉴질랜드) 실전 경험 풍부. 독일전(1차전) 17분 6점 2스틸. 최종예선 평균 11.4점/4.2리바/2.2어시로 팀 내 득점 2위.' },
    stats: { GP: 5, MIN: 25.6, PTS: 11.4, REB: 4.2, OREB: 0.6, AST: 2.2, STL: 1.2, BLK: 0, TO: 1.4, FG_PCT: 46.8, FG3_PCT: 27.8, FT_PCT: 72.7, FG3M: 1 },
  },
  {
    jersey_number: 2, name: '허예은 Yeeun Heo', position: '가드',
    bio: { height_cm: 167, birthdate: '2001-07-24', club: 'KB 스타즈',
      memo: '국대 경력: 2022 월드컵~현재. 이해란·진안과의 빠른 공격 전개 및 어시스트 능력. 독일전 21분 무득점 6어시 3리바. 최종예선 평균 6.2어시로 팀 내 1위.' },
    stats: { GP: 5, MIN: 19.8, PTS: 4.6, REB: 2.2, OREB: 0.4, AST: 6.2, STL: 1, BLK: 0, TO: 1.4, FG_PCT: 40, FG3_PCT: 31.3, FT_PCT: 100, FG3M: 1 },
  },
  {
    jersey_number: 3, name: '강이슬 Leeseul Kang', position: '포워드',
    bio: { height_cm: 180, birthdate: '1994-04-05', club: 'KB 스타즈',
      memo: '대표팀 주장, 2025 아시아컵 주전 슈터. 독일전 22분 11점(3점 2개). 필리핀전에서 3점 8개(24득점)를 몰아넣으며 최종예선 평균 18.6점으로 팀 내 최다득점.' },
    stats: { GP: 5, MIN: 26.2, PTS: 18.6, REB: 3, OREB: 0.2, AST: 1.8, STL: 1.6, BLK: 0, TO: 1.6, FG_PCT: 43.2, FG3_PCT: 41.5, FT_PCT: 100, FG3M: 5.4 },
  },
  {
    jersey_number: 5, name: '안혜지 Heji An', position: '가드',
    bio: { height_cm: 164, birthdate: '1997-02-12', club: 'BNK 썸',
      memo: '국대 경력: 2021 도쿄, 2025 아시아컵. 박지수와의 하이-로우 및 투맨 게임 조합 강점. 독일전 19분 3점 5어시. 최종예선 평균 4.2어시(팀 내 2위).' },
    stats: { GP: 5, MIN: 17.7, PTS: 3, REB: 1.6, OREB: 0.6, AST: 4.2, STL: 1.4, BLK: 0, TO: 1.2, FG_PCT: 50, FG3_PCT: 40, FT_PCT: 75, FG3M: 0.4 },
  },
  {
    jersey_number: 6, name: '최이샘 Isaem Choi', position: '포워드',
    bio: { height_cm: 183, birthdate: '1994-08-17', club: '신한은행',
      memo: '국대 경력: 2018·2022 월드컵, 2025 아시아컵. PF 포지션에서 스트레치 4 역할 수행. 독일전 19분 8점 2어시(야투 75%). 최종예선 평균 8.2점/3.8리바.' },
    stats: { GP: 5, MIN: 20.6, PTS: 8.2, REB: 3.8, OREB: 1.2, AST: 2, STL: 0.6, BLK: 0.2, TO: 0.8, FG_PCT: 48.5, FG3_PCT: 40.9, FT_PCT: 0, FG3M: 1.8 },
  },
  {
    jersey_number: 7, name: '박지수 Jisu Park', position: '센터',
    bio: { height_cm: 198, birthdate: '1998-12-06', club: 'KB 스타즈',
      memo: '최연소 국대 출신, 대표팀 12년 차 부동의 센터. 독일전 18분 7점 5리바 2블록. 최종예선 평균 8.4점/6.6리바/2.0블록(팀 내 1위)으로 대회 내내 더블더블을 노리는 활약.' },
    stats: { GP: 5, MIN: 21.3, PTS: 8.4, REB: 6.6, OREB: 2, AST: 3.4, STL: 0.6, BLK: 2, TO: 3, FG_PCT: 36.8, FG3_PCT: 0, FT_PCT: 73.7, FG3M: 0 },
  },
  {
    jersey_number: 9, name: '이소희 Sohee Lee', position: '가드',
    bio: { height_cm: 171, birthdate: '2000-08-07', club: 'BNK 썸',
      memo: '국대 경력: 2022 월드컵~현재. 발바닥 부상 복귀 후 가드진의 공격 화력 보강. 독일전 16분 2점 4파울. 부상 여파로 4경기만 출전, 평균 6.3점.' },
    stats: { GP: 4, MIN: 13.4, PTS: 6.3, REB: 1, OREB: 0.3, AST: 1.3, STL: 0.3, BLK: 0, TO: 1, FG_PCT: 39.1, FG3_PCT: 35.7, FT_PCT: 100, FG3M: 1.3 },
  },
  {
    jersey_number: 10, name: '강유림 Yoolim Kang', position: '포워드',
    bio: { height_cm: 175, birthdate: '1997-03-23', club: '삼성 블루밍스',
      memo: '국대 경력: 2024 사전예선, 2025 아시아컵. 포워드 라인의 성실한 수비와 궂은일 담당. 독일전 16분 무득점 1블록. 최종예선 평균 2.4점/0.6리바.' },
    stats: { GP: 5, MIN: 10.2, PTS: 2.4, REB: 0.6, OREB: 0.2, AST: 1, STL: 0.4, BLK: 0.2, TO: 0, FG_PCT: 30.8, FG3_PCT: 36.4, FT_PCT: 0, FG3M: 0.8 },
  },
  {
    jersey_number: 11, name: '박소희 Sohee Park', position: '가드',
    bio: { height_cm: 176, birthdate: '2003-05-15', club: '하나은행',
      memo: '국대 경력: 2024 월드컵 사전예선. 멕시코 대회 이후 재발탁된 차세대 가드 유망주. 독일전 5분 1점 1리바. 최종예선 평균 0.8점, 출전시간은 제한적.' },
    stats: { GP: 5, MIN: 5.8, PTS: 0.8, REB: 0.6, OREB: 0.4, AST: 0.8, STL: 0.4, BLK: 0, TO: 0.6, FG_PCT: 10, FG3_PCT: 14.3, FT_PCT: 50, FG3M: 0.2 },
  },
  {
    jersey_number: 12, name: '이해란 Haeran Lee', position: '포워드',
    bio: { height_cm: 180, birthdate: '2003-05-29', club: '삼성 블루밍스',
      memo: '국대 경력: 2022 월드컵~현재. WKBL 득점왕(김단비와 경쟁) 출신 팀 내 에이스. 독일전 20분 4점 6리바 2스틸. 최종예선 평균 7.2점/2.6리바/1.2스틸.' },
    stats: { GP: 5, MIN: 17.6, PTS: 7.2, REB: 2.6, OREB: 0.8, AST: 1.4, STL: 1.2, BLK: 0.6, TO: 1.2, FG_PCT: 31.6, FG3_PCT: 27.3, FT_PCT: 75, FG3M: 0.6 },
  },
  {
    jersey_number: 39, name: '홍유순 Yusun Hong', position: '센터',
    bio: { height_cm: 179, birthdate: '2005-02-23', club: '신한은행',
      memo: '대표팀 막내, 일본 출신 귀화 선수로 골밑 보탬. 국대 경력: 2025 FIBA 아시아컵. 독일전 12분 2점 2스틸. 최종예선 평균 1.2점/0.8리바.' },
    stats: { GP: 5, MIN: 7.2, PTS: 1.2, REB: 0.8, OREB: 0.8, AST: 0.6, STL: 0.6, BLK: 0, TO: 0.2, FG_PCT: 37.5, FG3_PCT: 0, FT_PCT: 0, FG3M: 0 },
  },
  {
    jersey_number: 77, name: '진안 An Jin', position: '센터',
    bio: { height_cm: 182, birthdate: '1996-03-23', club: '하나은행',
      memo: '국대 경력: 2019 아시아컵~현재. 부상 복귀 후 기동력 있는 센터 역할 수행. 독일전 16분 5점 4파울. 최종예선 평균 4.2점/3.0리바.' },
    stats: { GP: 5, MIN: 17, PTS: 4.2, REB: 3, OREB: 1, AST: 1, STL: 1, BLK: 0.4, TO: 1, FG_PCT: 32, FG3_PCT: 0, FT_PCT: 83.3, FG3M: 0 },
  },
];

async function main() {
  // 1. Create (or reuse) the team row
  const existing = await get(`/rest/v1/teams?sport_id=eq.${SPORT_ID}&name=eq.${encodeURIComponent('대한민국 여자농구 국가대표팀')}&select=id`);
  let teamId;
  if (existing.length > 0) {
    teamId = existing[0].id;
    await patch(`/rest/v1/teams?id=eq.${teamId}`, { extra: TEAM_EXTRA });
    console.log('team updated', teamId);
  } else {
    const [team] = await post('/rest/v1/teams', {
      sport_id: SPORT_ID, name: '대한민국 여자농구 국가대표팀', short_name: '대한민국', city: 'Korea', extra: TEAM_EXTRA,
    });
    teamId = team.id;
    console.log('team created', teamId);
  }

  // 2. Upsert players by jersey_number within this team
  const existingPlayers = await get(`/rest/v1/players?team_id=eq.${teamId}&select=id,jersey_number`);
  for (const p of PLAYERS) {
    const match = existingPlayers.find((x) => x.jersey_number === p.jersey_number);
    const payload = {
      sport_id: SPORT_ID, team_id: teamId, name: p.name, position: p.position,
      jersey_number: p.jersey_number, bio: p.bio, stats: p.stats,
    };
    if (match) {
      await patch(`/rest/v1/players?id=eq.${match.id}`, payload);
      console.log('player updated', p.name);
    } else {
      await post('/rest/v1/players', payload);
      console.log('player created', p.name);
    }
  }

  console.log('done. team_id =', teamId);
}

main().catch((e) => { console.error(e); process.exit(1); });
