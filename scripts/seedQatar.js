// Creates 카타르 남자농구 국가대표팀 (bball_nt) — full roster (16 players, all
// cross-verified against official FIBA box scores for the 6 finished Round 1
// games), coaching staff, memo, and full 12-game schedule (6 finished + 6
// Round 2 fixtures). Does NOT set group_standings/group_news — those already
// exist on 대한민국/레바논/사우디아라비아's team rows and the page reads
// whichever team has them; duplicating would be redundant.
//
// Sourced from fiba.basketball official game pages (box scores extracted via
// live box-score tab, not just the summary "game leaders" widget) + Wikipedia
// "2027 FIBA Basketball World Cup qualification (Asia)" + Qatar Basketball
// Federation / QNA / Peninsula Qatar / thepeninsulaqatar / jbasket.jp /
// news.sina.cn for Round 2 fixture confirmation (window 4/5/6 dates & venues).
//
// Usage:  node scripts/seedQatar.js
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

// ---------------------------------------------------------------------------
// Schedule (12 games). First 6 = Round 1 (Group D: QAT/LBN/KSA/IND), finished,
// record 4-2 (matches group_standings already stored: rank 3, 4승2패).
// Last 6 = Round 2 (Group F), 3 opponents (KOR/CHN/JPN) home & away.
// ---------------------------------------------------------------------------
const SCHEDULE = [
  { round: '1라운드', opponent_code: 'LBN', opponent_name: '레바논', home: true, date: '2025-11-28', venue: 'Doha, Lusail Multipurpose Hall (카타르)', status: 'finished', score_for: 74, score_against: 75, result: 'L', best_performer: 'Alen Hadzibegovic 19득점 10리바운드 (EFF 24)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126952-QAT-LBN' },
  { round: '1라운드', opponent_code: 'LBN', opponent_name: '레바논', home: false, date: '2025-12-01', venue: 'Zouk Mikael, Nouhad Nawfal Sports Complex (레바논)', status: 'finished', score_for: 86, score_against: 83, result: 'W', best_performer: 'Brandon Goodwin 25득점 8리바운드 8어시스트 (EFF 34)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126950-LBN-QAT' },
  { round: '1라운드', opponent_code: 'IND', opponent_name: '인도', home: true, date: '2026-02-27', venue: 'Doha, Lusail Multipurpose Hall (카타르)', status: 'finished', score_for: 99, score_against: 73, result: 'W', best_performer: 'Brandon Goodwin 23득점 5리바운드 3어시스트 (EFF 23)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126953-QAT-IND' },
  { round: '1라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: true, date: '2026-06-29', venue: 'Doha, Al-Gharafa Sports Club Multi-Purpose Hall (카타르)', status: 'finished', score_for: 80, score_against: 86, result: 'L', best_performer: 'Alen Hadzibegovic 25득점 8리바운드 (EFF 33)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126955-QAT-KSA' },
  { round: '1라운드', opponent_code: 'IND', opponent_name: '인도', home: false, date: '2026-07-02', venue: 'Ahmedabad, Veer Savarkar Indoor Stadium (인도)', status: 'finished', score_for: 65, score_against: 56, result: 'W', best_performer: 'Bobo Magassa 7득점 13리바운드 (EFF 19)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126957-IND-QAT' },
  { round: '1라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: false, date: '2026-07-06', venue: 'Jeddah, King Abdullah Sports City (사우디아라비아)', status: 'finished', score_for: 76, score_against: 73, result: 'W', best_performer: 'Alen Hadzibegovic 21득점 7리바운드 (EFF 23)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126949-KSA-QAT' },
  { round: '2라운드', opponent_code: 'CHN', opponent_name: '중국', home: true, date: '2026-08-27', venue: 'Al Wakrah, Al Janoub Arena (카타르)', note: '한국시간 8/28 01:00 · 2022 카타르 월드컵 축구 경기장을 개조한 알자누브 아레나의 첫 농구 경기, 무료 입장', status: 'scheduled', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126963-QAT-CHN' },
  { round: '2라운드', opponent_code: 'JPN', opponent_name: '일본', home: false, date: '2026-08-31', venue: 'Tokyo, Toyota Arena Tokyo (일본)', note: '한국시간 19:10', status: 'scheduled', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126960-JPN-QAT' },
  { round: '2라운드', opponent_code: 'KOR', opponent_name: '한국', home: true, date: '2026-11-26', venue: '미정 (카타르)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'JPN', opponent_name: '일본', home: true, date: '2026-11-29', venue: 'Doha (카타르)', note: '시간 미정', status: 'scheduled', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126965-QAT-JPN' },
  { round: '2라운드', opponent_code: 'CHN', opponent_name: '중국', home: false, date: '2027-02-26', venue: '미정 (중국)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'KOR', opponent_name: '한국', home: false, date: '2027-03-01', venue: '미정 (대한민국)', note: '구장·시간 미정', status: 'scheduled' },
];

const MEMO = `[감독] 하칸 데미르(터키) — 아나돌루 에페스에서 6년간 어시스턴트 코치로 재직했고 이란 남자농구 대표팀 감독을 거쳐 2024년 카타르 지휘봉을 잡음. "국가대표팀 하나에만 전념하는 건 이번이 처음"이라며 "카타르 농구에 24시간 모든 에너지를 쏟고 있다"고 강조. 부임 초반 아시아컵 예선을 0승2패로 시작했지만 이후 4승2패로 반등시켰고, 그 과정에서 친정팀 이란을 꺾는 성과도 냈다.

[귀화·용병 라인업] 브랜든 굿윈(183cm, 미국 출신·상하이 샤크스), 알렌 하지베고비치(211cm, 러시아 로코모티프-쿠반), 돈테 그랜섬(203cm, 미국 출신·일본 B리그 선라커스 시부야) 등 복수의 귀화·용병급 선수가 주축. 특히 하지베고비치는 5경기 평균 16.6득점 8.6리바운드로 에이스 역할을 하고 있고(사우디전 25득점 8리바운드, 레바논 원정 등판에서도 두 자릿수), 굿윈은 6.0어시스트를 곁들이며 공격을 조율한다. 주장은 국내파 가드 압둘라흐만 모하메드 사드(알아라비 SC) — 6경기 전 출전, 평균 14.8득점 3.3어시스트.

[역대 성과·트리비아] 카타르는 5인제 성인대표팀 최고 성적이 아시아선수권 동메달 2회(2003·2005)와 2006 도하 아시안게임 은메달이지만, 2014 FIBA 3x3 월드컵에서는 우승 경력이 있다. 개최국 자격으로 2027 월드컵 본선 진출은 이미 확정된 상태에서 예선을 치르는 특수한 위치. 현재 FIBA 세계랭킹 76위.

[8/27 중국전 트리비아] 2라운드 개막전인 중국戰은 2022 카타르 월드컵(축구) 경기장이었던 알자누브 스타디움을 8,200석 규모의 농구 전용 경기장으로 개조한 뒤 처음 여는 농구 경기 — 2027 월드컵 본선 1년 전 리허설 성격으로 무료 입장이 제공된다. 다만 상대 전적은 카타르에 불리한 편으로, 역대 중국과의 맞대결에서 6전 전패(가장 최근은 2017 레바논 아시아컵 67-92 패배)를 기록 중이다.`;

const COACHING_STAFF = [
  { name: '하칸 데미르(Hakan Demir)', role: '감독', since: 2024 },
];

// ---------------------------------------------------------------------------
// Roster — 16 players who all actually appeared in Round 1 box scores
// (jersey/position/box-score lines verified directly from fiba.basketball's
// live box-score tab for all 6 finished games, not just summary widgets).
// Season stats below are exact averages computed from those 6 box scores
// (cross-checked against FIBA's own aggregate leader page for Goodwin /
// Hadzibegovic / Saad / Grantham / Fouda — all matched exactly).
// ---------------------------------------------------------------------------
const ROSTER = [
  // name, jersey, position, stats, bio
  ['Brandon Goodwin', 0, '가드',
    { GP: 3, MIN: 30.7, PTS: 21.7, REB: 6.3, AST: 6.0, STL: 1.7, BLK: 0.3, FG3M: 3.0, FG_PCT: 53.7, FG3_PCT: 47.4, FT_PCT: 54.5 },
    { height_cm: 183, birthdate: '1995-10-02', club: 'Shanghai Sharks(중국)', memo: '귀화 선수(미국 출신). 팀 내 최다 득점·어시스트원.' }],
  ['Alen Hadzibegovic', 44, '센터',
    { GP: 5, MIN: 27.2, PTS: 16.6, REB: 8.6, AST: 2.0, STL: 2.8, BLK: 1.8, FG3M: 1.8, FG_PCT: 46.0, FG3_PCT: 47.4, FT_PCT: 59.3 },
    { height_cm: 211, birthdate: '1999-03-19', club: 'PBC Lokomotiv-Kuban(러시아)', memo: '귀화 선수. 211cm 빅맨 겸 팀 에이스.' }],
  ['Abdulrahman Mohamed Saad', 4, '가드',
    { GP: 6, MIN: 28.4, PTS: 14.8, REB: 4.5, AST: 3.3, STL: 0.5, BLK: 0.3, FG3M: 1.8, FG_PCT: 47.4, FG3_PCT: 39.3, FT_PCT: 44.4 },
    { height_cm: 185, birthdate: '1996-07-07', club: 'Al-Arabi SC', memo: '주장. 국내파 가드로 6경기 전 출전.' }],
  ['Moustafa Fouda', 0, '가드',
    { GP: 6, MIN: 29.8, PTS: 8.8, REB: 1.7, AST: 4.3, STL: 1.0, BLK: 0, FG3M: 0.8, FG_PCT: 30.6, FG3_PCT: 15.6, FT_PCT: 81.8 },
    { height_cm: null, birthdate: '', club: '' }],
  ['Donte Grantham', 1, '포워드',
    { GP: 3, MIN: 24.7, PTS: 10.7, REB: 6.7, AST: 0.7, STL: 0.7, BLK: 0, FG3M: 1.0, FG_PCT: 43.5, FG3_PCT: 37.5, FT_PCT: 69.2 },
    { height_cm: 203, birthdate: '1995-03-19', club: 'Sunrockers Shibuya(일본)', memo: '귀화 선수(미국 출신). 3라운드(윈도우3)부터 합류.' }],
  ['Tyler Harris', 1, '포워드',
    { GP: 3, MIN: 18.3, PTS: 8.0, REB: 2.7, AST: 1.0, STL: 0.7, BLK: 0.3, FG3M: 0, FG_PCT: 47.8, FG3_PCT: 0, FT_PCT: 50.0 },
    { height_cm: 201, birthdate: '', club: 'Al-Rayyan' }],
  ['Ndoye Seydou', 5, '센터',
    { GP: 3, MIN: 20.3, PTS: 6.7, REB: 2.0, AST: 1.0, STL: 2.0, BLK: 0.3, FG3M: 0.3, FG_PCT: 61.5, FG3_PCT: 100.0, FT_PCT: 75.0 },
    { height_cm: 203, birthdate: '', club: 'Al Sadd' }],
  ['Bobo Magassa', 33, '센터',
    { GP: 6, MIN: 16.2, PTS: 2.8, REB: 4.7, AST: 0.5, STL: 0.7, BLK: 0.3, FG3M: 0, FG_PCT: 35.3, FG3_PCT: 0, FT_PCT: 71.4 },
    { height_cm: 198, birthdate: '', club: 'Al-Rayyan' }],
  ['Ousmanediatta Dieng', 24, '가드',
    { GP: 6, MIN: 22.3, PTS: 5.7, REB: 2.5, AST: 0.5, STL: 0.7, BLK: 0.5, FG3M: 1.0, FG_PCT: 36.4, FG3_PCT: 60.0, FT_PCT: 80.0 },
    { height_cm: null, birthdate: '', club: '' }],
  ['Zineeddine Bedri', 8, '센터',
    { GP: 3, MIN: 10.3, PTS: 5.7, REB: 2.7, AST: 0.3, STL: 0, BLK: 0.3, FG3M: 0.7, FG_PCT: 40.0, FG3_PCT: 25.0, FT_PCT: 50.0 },
    { height_cm: 208, birthdate: '', club: 'Columbia Lions(미국·대학)', memo: '미국 출신, 컬럼비아대 농구부.' }],
  ['Moustapha Ndao', 19, '가드',
    { GP: 4, MIN: 13.3, PTS: 4.5, REB: 0.5, AST: 0.8, STL: 0.3, BLK: 0.3, FG3M: 0.8, FG_PCT: 30.8, FG3_PCT: 37.5, FT_PCT: 63.6 },
    { height_cm: 188, birthdate: '', club: 'Al Ahli SC' }],
  ['Abdulla Mousa', 10, '가드',
    { GP: 2, MIN: 7.5, PTS: 7.0, REB: 1.0, AST: 0.5, STL: 1.0, BLK: 0, FG3M: 1.0, FG_PCT: 71.4, FG3_PCT: 100.0, FT_PCT: 66.7 },
    { height_cm: null, birthdate: '', club: '' }],
  ['Babacar Dieng', 23, '포워드',
    { GP: 5, MIN: 10.2, PTS: 2.4, REB: 1.4, AST: 0, STL: 0.4, BLK: 0.8, FG3M: 0.4, FG_PCT: 20.0, FG3_PCT: 18.2, FT_PCT: 50.0 },
    { height_cm: 196, birthdate: '', club: 'Al Sadd' }],
  ['Mohammed Abbasher', 14, '포워드',
    { GP: 4, MIN: 10.5, PTS: 0.5, REB: 1.8, AST: 0.8, STL: 0.3, BLK: 0.3, FG3M: 0, FG_PCT: 25.0, FG3_PCT: 0, FT_PCT: null },
    { height_cm: 201, birthdate: '', club: 'Al Ahli SC' }],
  ['Omar Saad', 13, '가드',
    { GP: 1, MIN: 6.8, PTS: 0, REB: 1.0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: 0, FG3_PCT: 0, FT_PCT: null },
    { height_cm: 184, birthdate: '', club: 'Al-Wakrah SC' }],
  ['Mahmoud Luay M Darwish', 3, '가드',
    { GP: 1, MIN: 2.2, PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG3M: 0, FG_PCT: null, FG3_PCT: null, FT_PCT: null },
    { height_cm: 191, birthdate: '', club: 'Al Ahli SC' }],
];

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const sportId = sport.id;
  const TEAM_NAME = '카타르 남자농구 국가대표팀';

  await post('/rest/v1/teams?on_conflict=sport_id,name',
    { sport_id: sportId, name: TEAM_NAME, short_name: '카타르', city: 'Qatar',
      extra: { competition: 'FIBA Basketball World Cup 2027 Asian Qualifiers', group: 'F', memo: MEMO, coaching_staff: COACHING_STAFF, schedule: SCHEDULE } },
    { Prefer: 'resolution=merge-duplicates,return=representation' });
  const [team] = await get('/rest/v1/teams?sport_id=eq.' + sportId + '&name=eq.' + encodeURIComponent(TEAM_NAME) + '&select=id');
  console.log('team ok', team.id);

  await req('DELETE', `/rest/v1/players?team_id=eq.${team.id}`);
  const rows = ROSTER.map(([name, jersey, position, stats, bio]) => ({ sport_id: sportId, team_id: team.id, name, jersey_number: jersey, position, stats, bio }));
  await post('/rest/v1/players', rows);
  console.log('roster ok (' + rows.length + ')');
}

main().catch((e) => { console.error(e); process.exit(1); });
