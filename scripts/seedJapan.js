// Creates 일본 남자농구 국가대표팀 (bball_nt) — roster, coaching staff, memo,
// and full 1·2라운드 (12경기) schedule. Mirrors the Korea/Lebanon/Saudi pattern
// (see scripts/seedSaudiArabia.js, patchKoreaSchedule.js, patchGroupFStandingsNews.js).
//
// Roster = Japan Basketball Association's Window 4 (Aug 27-31, 2026) camp call-up,
// 17 players (14 announced 8/3 + 3 added 8/11: Takashima, Schafer, Kano). Hachimura
// and Kawamura are NBA-based returnees with no Round-1 stats (didn't play Round 1).
// Season stats (Summary) are Round-1 cumulative averages sourced from each player's
// FIBA tournament stat page where found; players without a found stat page carry NA.
//
// Schedule: Round 1 (vs Chinese Taipei x2, China x2, Korea x2) all finished, sourced
// from Wikipedia's Group B results table cross-checked against individual FIBA game
// pages (venues/top-scorers) and already-verified Korea data for the 2 KOR games.
// Round 2 (vs Saudi Arabia, Qatar, Lebanon x2 each): KSA/LBN dates already fixed via
// derived_schedules.json (mirrored off Saudi/Lebanon's own already-built schedules);
// QAT dates (8/31 Tokyo home, 11/29 Qatar away) confirmed via Japanese-language news
// (jbasket.jp / basket-count.com Window 4 ticket announcements).
//
// Final Round-1 record: 2-0 TPE, 1-1 CHN, 1-1 KOR = 4-2, matching FIBA's official
// Group F standings (rank 2, 4승2패) already stored on Korea/Lebanon/Saudi's rows.
//
// Usage:  node scripts/seedJapan.js
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function req(method, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...(extraHeaders || {}) };
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
const post = (path, body, extraHeaders) => req('POST', path, body, extraHeaders);

const NA = { PTS: null, REB: null, AST: null, STL: null, BLK: null, FG_PCT: null, FG3M: null, FG3_PCT: null, FT_PCT: null };

// [name, jersey, position(KR), stats, bio]
const ROSTER = [
  ['Yuta Watanabe', null, '포워드',
    { GP: 6, MIN: 33.5, PTS: 16.0, REB: 6.8, AST: 1.8, STL: 0.7, BLK: 2.0, FG_PCT: 44.9, FG3M: 1.0, FG3_PCT: 21.4, FT_PCT: 83.3 },
    { height_cm: 206, birthdate: '1994-10-13', club: 'Chiba Jets',
      memo: '주장. 前 NBA(멤피스·브루클린·서스 등) 6시즌 경력의 슈터형 윙. 2024 파리올림픽에 이어 이번 예선에서도 대표팀 정신적 지주 역할.' }],
  ['Josh Hawkinson', null, '센터',
    { GP: 5, MIN: 34.0, PTS: 21.6, REB: 9.4, AST: 3.6, STL: 1.0, BLK: 1.2, FG_PCT: 54.9, FG3M: 2.0, FG3_PCT: 35.7, FT_PCT: 80.0 },
    { height_cm: 208, birthdate: '1995-06-23', club: 'Sunrockers Shibuya',
      memo: '시애틀 출신 귀화 빅맨(부모 모두 노르웨이·덴마크 국가대표 출신 농구인). 1라운드 사실상 MVP급 활약(경기당 21.6득점 9.4리바운드)으로 팀 에이스. 한일전 2경기서 각각 26득점·38득점을 기록.' }],
  ['Rui Hachimura', null, '포워드',
    NA,
    { height_cm: 203, birthdate: '1998-02-08', club: 'LA Clippers(미국)',
      memo: '2라운드를 앞두고 약 2년 만에 성인 대표팀 복귀. 곤자가대 출신으로 FIBA 무대 경험이 많은 대표팀 최대 자원. 1라운드는 결장해 이번 시즌 누적 스탯은 없음.' }],
  ['Yuki Kawamura', null, '가드',
    NA,
    { height_cm: 172, birthdate: '2001-10-05', club: 'LA Clippers(미국)',
      memo: '하치무라와 함께 2라운드 전격 복귀. 최근 클리퍼스와 Exhibit 10 계약 체결. "우리 목표는 아시아 우승이 아니라 세계 무대에서 이기는 것"이라고 인터뷰. 1라운드 결장으로 스탯 없음.' }],
  ['Yuki Togashi', null, '가드',
    { GP: 4, MIN: 13.7, PTS: 4.8, REB: 1.8, AST: 3.3, STL: 0.3, BLK: 0, FG_PCT: 40.0, FG3M: 0.75, FG3_PCT: 27.3, FT_PCT: 100.0 },
    { height_cm: 167, birthdate: '1993-07-30', club: 'Chiba Jets', memo: '베테랑 포인트가드. 신구 조화를 이루는 대표팀의 노련한 조율자.' }],
  ['Takumi Saito', null, '가드',
    { GP: 6, MIN: 17.9, PTS: 5.7, REB: 2.3, AST: 4.8, STL: 0.5, BLK: 0, FG_PCT: 52.2, FG3M: 0.5, FG3_PCT: 37.5, FT_PCT: 100.0 },
    { height_cm: 172, birthdate: '', club: 'Nagoya Diamond Dolphins', memo: '이번 예선 팀 내 어시스트 1위(경기당 4.8개).' }],
  ['Yudai Nishida', null, '가드',
    { GP: 6, MIN: 26.1, PTS: 11.5, REB: 3.7, AST: 2.2, STL: 0.8, BLK: 0.3, FG_PCT: 41.8, FG3M: 1.7, FG3_PCT: 32.3, FT_PCT: 86.7 },
    { height_cm: 190, birthdate: '1999-03-13', club: 'Seahorses Mikawa', memo: '2025-12-01 대만 원정에서 19득점으로 팀 내 최다 득점을 기록.' }],
  ['Yudai Baba', null, '포워드',
    { ...NA, STL: 1.3, BLK: 0.7 },
    { height_cm: 196, birthdate: '1995-11-07', club: 'Nagasaki Velca', memo: '노련한 스몰포워드. 수비 활동량이 많은 자원.' }],
  ['Keisei Tominaga', null, '가드',
    NA,
    { height_cm: 188, birthdate: '2001-02-01', club: 'Levanga Hokkaido', memo: '네브래스카대 출신 왼손 슈터 "재패니즈 커리". 2/26 중국전에서 14득점.' }],
  ['Takanari Sasaki', null, '가드', NA, { height_cm: 180, birthdate: '', club: 'Rizing Zephyr Fukuoka' }],
  ['Torataka Yoshii', null, '포워드', NA, { height_cm: 196, birthdate: '', club: 'Ibaraki Robots' }],
  ['Hiyuu Watanabe', null, '포워드', NA, { height_cm: 207, birthdate: '', club: 'Ibaraki Robots' }],
  ['Akira Jacobs', null, '포워드', NA, { height_cm: 203, birthdate: '', club: 'Fordham University(미국)', memo: '요코하마 출신, 2024 파리올림픽 대표팀 경력. 하와이대에서 편입.' }],
  ['Yuto Kawashima', null, '포워드', NA, { height_cm: 206, birthdate: '2005-05-27', club: 'Seattle University(미국)' }],
  ['Shinji Takashima', null, '가드', NA, { height_cm: 191, birthdate: '', club: 'Utsunomiya Brex', memo: '2026 재팬 라이프컵 활약으로 8/11 추가 소집.' }],
  ['Avi Schafer', null, '포워드', NA, { height_cm: 206, birthdate: '', club: 'Sendai 89ERS', memo: '2026 재팬 라이프컵 활약으로 8/11 추가 소집.' }],
  ['Tomoshige Kano', null, '센터', NA, { height_cm: 210, birthdate: '', club: 'Sunrockers Shibuya', memo: '2026 재팬 라이프컵 활약으로 8/11 추가 소집된 210cm 빅맨.' }],
];

const SCHEDULE = [
  // 1라운드 (Group B: 대만·중국·한국) — 4승2패로 조 1위 통과
  { round: '1라운드', opponent_code: 'TPE', opponent_name: '대만', home: true,
    date: '2025-11-28', venue: 'Glion Arena Kobe, 고베 (일본)',
    status: 'finished', score_for: 90, score_against: 64, result: 'W',
    best_performer: 'Josh Hawkinson 27득점',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126925-JPN-TPE' },
  { round: '1라운드', opponent_code: 'TPE', opponent_name: '대만', home: false,
    date: '2025-12-01', venue: 'Xinzhuang Gymnasium, 신베이 (대만)',
    status: 'finished', score_for: 80, score_against: 73, result: 'W',
    best_performer: 'Yudai Nishida 19득점',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126933-TPE-JPN' },
  { round: '1라운드', opponent_code: 'CHN', opponent_name: '중국', home: true,
    date: '2026-02-26', venue: 'Okinawa Arena, 오키나와 (일본)',
    status: 'finished', score_for: 80, score_against: 87, result: 'L',
    best_performer: 'Alex Kirk 18득점',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126930-JPN-CHN' },
  { round: '1라운드', opponent_code: 'KOR', opponent_name: '한국', home: true,
    date: '2026-03-01', venue: 'Okinawa Arena, 오키나와 (일본)', note: '한국의 삼일절',
    status: 'finished', score_for: 78, score_against: 72, result: 'W',
    best_performer: 'Josh Hawkinson 26득점',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126928-JPN-KOR' },
  { round: '1라운드', opponent_code: 'CHN', opponent_name: '중국', home: false,
    date: '2026-07-03', venue: 'Liaoning Gymnasium, 선양 (중국)',
    status: 'finished', score_for: 92, score_against: 73, result: 'W',
    best_performer: 'Josh Hawkinson 31득점',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126926-CHN-JPN' },
  { round: '1라운드', opponent_code: 'KOR', opponent_name: '한국', home: false,
    date: '2026-07-06', venue: '고양체육관 (대한민국)',
    status: 'finished', score_for: 79, score_against: 81, result: 'L',
    best_performer: 'Josh Hawkinson 38득점',
    source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126923-KOR-JPN' },
  // 2라운드 (F조 재편성 — 사우디·카타르·레바논과 홈&어웨이)
  { round: '2라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: false,
    date: '2026-08-28', venue: 'Jeddah (사우디아라비아)', note: '한국시간 02:00',
    status: 'scheduled' },
  { round: '2라운드', opponent_code: 'QAT', opponent_name: '카타르', home: true,
    date: '2026-08-31', venue: 'TOYOTA ARENA TOKYO, 도쿄 (일본)', note: '19:10 팁오프',
    status: 'scheduled' },
  { round: '2라운드', opponent_code: 'LBN', opponent_name: '레바논', home: false,
    date: '2026-11-26', venue: '미정 (레바논)', note: '구장·시간 미정',
    status: 'scheduled' },
  { round: '2라운드', opponent_code: 'QAT', opponent_name: '카타르', home: false,
    date: '2026-11-29', venue: '미정 (카타르)', note: '구장·시간 미정',
    status: 'scheduled' },
  { round: '2라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: true,
    date: '2027-02-26', venue: '미정 (일본)', note: '구장·시간 미정',
    status: 'scheduled' },
  { round: '2라운드', opponent_code: 'LBN', opponent_name: '레바논', home: true,
    date: '2027-03-01', venue: '미정 (일본)', note: '구장·시간 미정',
    status: 'scheduled' },
];

const MEMO = `[감독 오케타니 스타일] 2026년 2월 취임한 오케타니 다이(桶谷大) 감독은 2021~2026년 류큐 골든킹스를 5년 연속 B리그 파이널로 이끌며 2022-23시즌 구단 첫 우승, 2024-25시즌 덴노배(일왕배) 우승까지 안긴 지도자. 대표팀 지휘봉을 잡은 뒤에도 클럽 커리어를 이어가 2026년 6월엔 가와사키 브레이브 썬더스 감독까지 겸임한다고 발표해 화제가 됐다. 본인이 밝힌 목표는 "세계 정상급 국가들과 어깨를 나란히 하는 일본 대표팀을 만드는 것" — 가와무라도 "우리 목표는 아시아 우승이 아니라 세계 무대에서 이기는 것"이라며 같은 톤의 발언을 남겼다.

[하치무라·가와무라 복귀] 2라운드를 앞두고 약 2년 만에 성인 대표팀에 복귀한 NBA 듀오 — LA 클리퍼스 소속 하치무라 루이, 최근 클리퍼스와 Exhibit 10 계약을 맺은 가와무라 유키. 오케타니 감독은 "지금이 우리가 모을 수 있는 최강의 선수단이라고 확신한다"고 언급했다. 둘 다 1라운드엔 뛰지 않아 이번 캠페인 누적 스탯은 없고, 최종 12인 엔트리 승선 여부도 컨디션 점검 결과에 달려 있다는 후문.

[한일전 포인트] 2026년 3월 1일(한국의 삼일절) 오키나와 홈경기에서 일본이 한국을 78-72로 제압 — 호킨슨이 26득점으로 활약했다. 7월 6일 고양 원정 리턴매치에서는 호킨슨 혼자 38득점을 몰아넣고도 79-81로 아쉽게 패해 한일전은 1승1패로 마무리됐다. 2라운드 재편 조에서는 한국과 다시 만나지 않고 사우디·카타르·레바논을 상대한다.

[중국전 굴곡] 2월 26일 오키나와 홈에서 한때 앞서다가도 중국에 80-87로 역전패 — 대회 전부터 "1936년 이후 90년 가까이 중국 상대 2승19패"라는 열세가 거론되며 우려됐던 그대로였다. 그러나 7월 3일 선양 원정에서는 호킨슨이 31득점을 몰아치며 92-73 완승, 1라운드를 4승2패 조 1위로 통과하며 2라운드 진출을 확정지었다.

[호킨슨 스토리] 시애틀 출신 귀화 빅맨(부친 넬스는 노르웨이, 모친 낸시는 덴마크 국가대표 출신 농구인 집안). 고교 시절엔 야구 투수로도 활약했을 만큼 다재다능한 운동신경의 소유자. 1라운드 사실상 MVP급 활약(경기당 21.6득점 9.4리바운드)으로 이번 대표팀의 실질적 에이스 역할을 맡고 있다.

[윈도우4 전망] 8월 27~28일(한국시간) 사우디아라비아 원정(제다) 이후, 8월 31일 카타르와의 홈경기는 도쿄 토요타 아레나에서 19:10 팁오프로 열린다 — 하치무라·가와무라의 대표팀 복귀전이자 오케타니 감독의 자국 안방 데뷔전이기도 하다.`;

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const sportId = sport.id;

  await post('/rest/v1/teams?on_conflict=sport_id,name',
    { sport_id: sportId, name: '일본 남자농구 국가대표팀', short_name: '일본', city: 'Japan',
      extra: {
        competition: 'FIBA Basketball World Cup 2027 Asian Qualifiers',
        group: 'F',
        coaching_staff: [{ role: '감독', name: '오케타니 다이(桶谷大, Dai Oketani)', since: 2026 }],
        schedule: SCHEDULE,
        memo: MEMO,
      } },
    { Prefer: 'resolution=merge-duplicates,return=representation' });

  const [team] = await get('/rest/v1/teams?sport_id=eq.' + sportId + '&name=eq.' + encodeURIComponent('일본 남자농구 국가대표팀') + '&select=id');
  console.log('team ok', team.id);

  await req('DELETE', `/rest/v1/players?team_id=eq.${team.id}`);
  const rows = ROSTER.map(([name, jersey, position, stats, bio]) => ({ sport_id: sportId, team_id: team.id, name, jersey_number: jersey, position, stats, bio }));
  await post('/rest/v1/players', rows);
  console.log('roster ok (' + rows.length + ')');
}

main().catch((e) => { console.error(e); process.exit(1); });
