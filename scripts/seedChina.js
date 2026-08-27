// Creates 중국 남자농구 국가대표팀 (bball_nt) — roster, coaching staff, memo, and full
// 1·2라운드 schedule (F조, FIBA Basketball World Cup 2027 Asian Qualifiers). Mirrors
// the Korea/Lebanon/Saudi Arabia pattern (see scripts/seedSaudiArabia.js,
// scripts/patchKoreaSchedule.js). Does NOT set group_standings/group_news — those
// already exist on 대한민국/레바논's team rows and the sport page reads whichever
// team has them.
//
// Sources: fiba.basketball game/player pages + news reports, Wikipedia "2027 FIBA
// Basketball World Cup qualification (Asia)" fixture table (used to resolve two
// date-extraction errors from individual FIBA article pages — see comments below).
// Round-1 (6 games, all finished) W-L record: 3-3, matching F조 group_standings
// already stored on 대한민국/사우디아라비아's rows (중국 rank 5, 3승3패).
//
// Round-2 (window4/5/6) vs 레바논·사우디아라비아 dates/results mirrored from those
// teams' own schedules (see ../../scratchpad/derived_schedules.json) — venue/
// best_performer filled in from 중국's own side where the game has been played
// (none have, as of today 2026-08-26; all 6 Round-2 games are still scheduled).
// vs 카타르 (2 games) researched fresh: window4 away leg date/venue confirmed via
// Qatar Living + FIBA game page; window6 home leg date is an estimate (2027-02-26,
// the other open slot in that window opposite the already-confirmed KSA game on
// 2027-03-01) since FIBA hasn't published an exact date yet.
//
// GAME_LOG for round-1 (patchChinaGameLogs.js) intentionally omits OREB/DREB/PF/TO/
// +/- (set to null) — FIBA's game-boxscore pages didn't reliably expose those splits
// via automated fetch (unlike MIN/PTS/FG/3PT/FT/REB/AST/STL/BLK, which were cross-
// checked against multiple independent FIBA player-profile pages + news recaps and
// matched exactly, e.g. Zhu Junlong's 19pts/5x3PT and Zhao Jiwei's 17pts/6ast/5x3PT
// both confirmed by CGTN/FIBA news copy). EFF is therefore a simplified PTS+REB+AST+
// STL+BLK-(FGA-FGM)-(FTA-FTM) proxy, no turnover term.
//
// Usage:  node scripts/seedChina.js
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

// [name, jersey, position(Korean label), GP, MIN, stats, bio]
const ROSTER = [
  ['Zhao Jiwei', 4, '가드', 4, 20.0, { PTS: 12.0, REB: 3.0, AST: 3.8, STL: 0.8, BLK: 0, FG_PCT: 44.1, FG3M: 2.8, FG3_PCT: 42.3, FT_PCT: 87.5 }, { height_cm: 185, birthdate: '1995-08-25', club: 'Liaoning Flying Leopards', memo: '주장(캡틴). 베테랑 포인트가드로 3점 슈팅 비중이 큼 — 7/6 대만전 6어시스트·3점 5개(17득점)로 이번 예선 최고 활약.' }],
  ['Hu Jinqiu', 21, '센터', 6, 24.3, { PTS: 15.2, REB: 5.8, AST: 0.8, STL: 0.3, BLK: 0.2, FG_PCT: 74.0, FG3M: 0.2, FG3_PCT: 50.0, FT_PCT: 88.9 }, { height_cm: 210, birthdate: '1999-09-24', club: 'Zhejiang Lions', memo: '1라운드 6경기 전 출전, 야투 74%의 높은 효율로 골밑을 지배. 일본전(2/26) 20득점 12리바운드로 팀 최고 활약.' }],
  ['Liao Sanning', 5, '가드', 6, 23.0, { PTS: 11.3, REB: 2.3, AST: 4.8, STL: 0.8, BLK: 0, FG_PCT: 43.8, FG3M: 0, FG3_PCT: 0, FT_PCT: 66.7 }, { height_cm: 191, birthdate: '2001-01-29', club: 'Beijing Royal Fighters', memo: '팀 내 어시스트 1위 콤보가드. 한국 원정 2차전(12/1)에서 10어시스트 기록.' }],
  ['Zhu Junlong', 26, '포워드', 6, 27.0, { PTS: 5.5, REB: 5.8, AST: 1.5, STL: 0.5, BLK: 0.2, FG_PCT: 32.3, FG3M: 1.0, FG3_PCT: 40.0, FT_PCT: 87.5 }, { height_cm: 201, birthdate: '1997-07-13', club: 'Zhejiang Lions', memo: '대만 원정(3/1)에서 19득점(3점 5/6)으로 폭발, 팀 최고 EFF 22 기록.' }],
  ['Zhou Qi', null, '센터', 2, 18.4, { PTS: 14.0, REB: 13.5, AST: 0, STL: 0, BLK: 0.5, FG_PCT: 75.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 62.5 }, { height_cm: 216, birthdate: '1996-01-16', club: 'Beijing Ducks', memo: 'NBA 경험(휴스턴 로키츠 2016 지명)의 스트레치 빅맨. 1라운드 윈도우1(한국전 2연전)에만 출전해 12/1 원정에서 17득점 15리바운드(EFF 32, 팀 최고) 폭발. 윈도우4(8월) 소집 명단에는 이름이 빠져 있어 로테이션 여부가 변수.' }],
  ['Zhao Rui', null, '가드', 2, 23.0, { PTS: 11.0, REB: 4.0, AST: 4.0, STL: 1.5, BLK: 0, FG_PCT: 17.6, FG3M: 1.0, FG3_PCT: 20.0, FT_PCT: 82.4 }, { height_cm: 196, birthdate: '1996-01-14', club: 'Beijing Ducks', memo: '콤보가드. 윈도우2(2~3월) 일본·대만전에만 출전, 자유투로 다득점(대만전 6/9).' }],
  ['Cheng Shuaipeng', null, '가드', 2, 22.0, { PTS: 12.5, REB: 1.0, AST: 1.5, STL: 0.5, BLK: 0, FG_PCT: 50.0, FG3M: 1.0, FG3_PCT: 50.0, FT_PCT: 75.0 }, { height_cm: 191, birthdate: '1999-06-03', club: 'Zhejiang', memo: '윈도우1(한국전)에서만 출전, 12/1 원정경기 19득점으로 깜짝 활약.' }],
  ['He Xining', 23, '가드', 4, 20.6, { PTS: 9.5, REB: 1.8, AST: 1.5, STL: 1.0, BLK: 0, FG_PCT: 40.0, FG3M: 1.8, FG3_PCT: 36.8, FT_PCT: 75.0 }, { height_cm: 193, birthdate: '1997-01-22', club: 'Shenzhen Leopards', memo: '3점 슈팅 가드, 윈도우2·3(일본·대만전)에 고정 출전.' }],
  ['Yang Hansen', 51, '센터', 2, 15.3, { PTS: 9.5, REB: 5.5, AST: 1.5, STL: 1.0, BLK: 1.0, FG_PCT: 53.8, FG3M: 0, FG3_PCT: 0, FT_PCT: 50.0 }, { height_cm: 216, birthdate: '2005-06-26', club: 'Portland Trail Blazers(NBA)', memo: '2025 NBA 드래프트 16순위(멤피스 지명 후 포틀랜드 트레이드) — 이위젠룽 이후 최고 순위 중국인 지명. NBA 루키 시즌 47경기 소화. 2025 아시아컵은 포틀랜드 루키캠프 참가를 이유로 불참(CBA 승인)해 논란이 있었으나, 윈도우3(6/29~7/6)에 대표팀 복귀. 다만 성인 국제무대 피지컬에는 아직 적응 중이라는 평가(2경기 9.5득점 5.5리바운드에 그침).' }],
  ['Gao Shiyan', 0, '가드', 6, 15.0, { PTS: 4.0, REB: 2.5, AST: 1.5, STL: 0.7, BLK: 0, FG_PCT: 38.1, FG3M: 0.5, FG3_PCT: 33.3, FT_PCT: 75.0 }, { height_cm: 186, birthdate: '1996-01-22', club: 'Shandong Hi-Speed Kirin' }],
  ['Zeng Fanbo', null, '포워드', 2, 8.2, { PTS: 1.0, REB: 0.5, AST: 0.5, STL: 0, BLK: 0.5, FG_PCT: 20.0, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 208, birthdate: null, club: 'Beijing Ducks' }],
  ['Xu Xin', 19, '센터', 2, 0.5, { PTS: 0, REB: 0, AST: 0, STL: 0, BLK: 0, FG_PCT: 0, FG3M: 0, FG3_PCT: 0, FT_PCT: 0 }, { height_cm: 226, birthdate: '2003-12-03', club: 'Guangzhou Loong Lions', memo: '팀 내 최장신(226cm). 윈도우3 2경기 모두 출전시간 1분 미만.' }],
  // 신규 소집(윈도우4 명단에 새로 포함, 이번 예선 출전 기록 없음)
  ['Pang Zhenglin', 9, '가드', null, null, NA, { height_cm: 183, birthdate: '1999-04-24', club: 'Jiangsu Dragons' }],
  ['Wang Junjie', 10, '포워드', null, null, NA, { height_cm: 206, birthdate: '2005-04-03', club: 'UMass Minutemen(미국 대학)', memo: '해외파(NCAA UMass). 2025 아시아컵 올스타 5인에 선정됐던 자원으로, 윈도우4에 새로 소집.' }],
  ['Li Hongquan', 14, '포워드', null, null, NA, { height_cm: 198, birthdate: '2001-09-29', club: 'Shanghai Sharks' }],
  ['Cui Yongxi', 24, '포워드', null, null, NA, { height_cm: 196, birthdate: '2003-05-28', club: 'Guangdong Southern Tigers' }],
];

const MEMO = `[감독] 궈스창(郭士强) — 2024년 7월 세르비아 출신 알렉산다르 조르제비치의 후임으로 부임, 2009년에 이어 두 번째 대표팀 지휘봉(1기 때는 아시아선수권 결승에서 이란에 대패 후 사퇴). 코칭 철학은 "양 엔드 밸런스·인사이드-아웃·빠른 트랜지션·팀 농구"의 4대 원칙으로 요약되며, 올림픽·월드컵 데이터 분석을 근거로 경기당 67~70개의 야투 시도를 목표치로 제시. 선수 선발 기준으로 "대표팀에 대한 열망, 최고의 기량, 대표팀에 맞는 유형, 진짜 파이터, 최상의 컨디션" 5가지를 강조. 2025 아시아컵에서 은메달을 이끌며 팀 분위기를 반전시켰다는 평가.

[양한선(Yang Hansen) 스토리] 2025 NBA 드래프트 16순위(멤피스 지명 → 포틀랜드 트레일블레이저스 트레이드)로 이위젠룽(2007년) 이후 최고 순위 중국인 지명자. NBA 루키 시즌 47경기를 소화했지만, 2025 아시아컵은 포틀랜드 루키캠프 참가를 이유로 불참해(CBA 승인) 국내에서 논란이 있었다. 윈도우3(6/29~7/6)에 대표팀에 복귀했으나 2경기 9.5득점 5.5리바운드에 그쳐 "아시아 무대의 피지컬에는 아직 적응 중"이라는 평가.

[저우치(Zhou Qi) 변수] 2016년 휴스턴 로키츠에 지명됐던 NBA 경험의 스트레치 빅맨. 1라운드 윈도우1(한국 2연전)에서만 출전해 12/1 원정 경기 17득점 15리바운드(EFF 32, 팀 내 이번 예선 최고 기록)를 남겼지만, 이후 윈도우2·3(일본·대만전)에는 소집되지 않았고 윈도우4(8월) 명단에도 이름이 없다 — 대표팀 합류 여부가 불투명한 상태.

[라이벌 구도] 1라운드에서 한국에 스윕패(2전 2패), 일본과는 1승1패로 팽팽했고 대만은 2전 2승으로 압도. 대만과의 2경기는 모두 정치적 민감성 때문인지 중립지(고양 한국, 마닐라 필리핀)에서 열렸다. 3승3패로 조 3위에 그쳤지만 2라운드(F조 최종 6개팀)에 안착.

[2라운드 전망] 8/27 카타르 원정(알자누브 아레나 — 2022 카타르 월드컵 축구 경기장을 개조한 신축 농구장에서 열리는 첫 농구 경기), 8/31 레바논 홈경기로 윈도우4를 시작. 카타르·레바논·사우디아라비아를 상대로 각각 2연전씩 치러야 하는 험난한 일정.`;

const SCHEDULE = [
  // ── 1라운드 (전적 3승3패, F조 group_standings와 일치) ──
  { round: '1라운드', opponent_code: 'KOR', opponent_name: '한국', home: true, date: '2025-11-28', venue: 'Beijing, Wukesong Sport Arena (중국)', status: 'finished', score_for: 76, score_against: 80, result: 'L', best_performer: 'Liao Sanning (EFF 21)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126934-CHN-KOR' },
  { round: '1라운드', opponent_code: 'KOR', opponent_name: '한국', home: false, date: '2025-12-01', venue: '대한민국', status: 'finished', score_for: 76, score_against: 90, result: 'L', best_performer: 'Zhou Qi (EFF 32)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126932-KOR-CHN' },
  { round: '1라운드', opponent_code: 'JPN', opponent_name: '일본', home: false, date: '2026-02-26', venue: 'Okinawa Arena, Okinawa (일본)', status: 'finished', score_for: 87, score_against: 80, result: 'W', best_performer: 'Hu Jinqiu (EFF 31)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126930-JPN-CHN' },
  { round: '1라운드', opponent_code: 'TPE', opponent_name: '대만', home: false, date: '2026-03-01', venue: 'Mall of Asia Arena, Manila (필리핀)', note: '중립지 개최', status: 'finished', score_for: 100, score_against: 93, result: 'W', best_performer: 'Zhu Junlong (EFF 22)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126927-TPE-CHN' },
  { round: '1라운드', opponent_code: 'JPN', opponent_name: '일본', home: true, date: '2026-07-03', venue: 'Shenyang, Liaoning Gymnasium (중국)', status: 'finished', score_for: 73, score_against: 92, result: 'L', best_performer: 'Hu Jinqiu (EFF 17)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126926-CHN-JPN' },
  { round: '1라운드', opponent_code: 'TPE', opponent_name: '대만', home: true, date: '2026-07-06', venue: 'Goyang Gymnasium, Goyang (대한민국)', note: '중립지 개최', status: 'finished', score_for: 92, score_against: 74, result: 'W', best_performer: 'Zhao Jiwei (EFF 23)', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126931-CHN-TPE' },
  // ── 2라운드 (F조 최종 6개팀 — 카타르·레바논·사우디아라비아와 홈&어웨이) ──
  { round: '2라운드', opponent_code: 'QAT', opponent_name: '카타르', home: false, date: '2026-08-27', venue: 'Al Janoub Arena, Al Wakrah (카타르)', note: '현지시간 19:00', status: 'scheduled', source_url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/games/126963-QAT-CHN' },
  { round: '2라운드', opponent_code: 'LBN', opponent_name: '레바논', home: true, date: '2026-08-31', venue: '미정 (중국)', note: '시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: false, date: '2026-11-26', venue: '미정 (사우디아라비아)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'LBN', opponent_name: '레바논', home: false, date: '2026-11-29', venue: '미정 (레바논)', note: '구장·시간 미정', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'QAT', opponent_name: '카타르', home: true, date: '2027-02-26', venue: '미정 (중국)', note: '구장·시간 미정 (FIBA 공식 발표 대기, 날짜는 윈도우6 잔여 슬롯 추정)', status: 'scheduled' },
  { round: '2라운드', opponent_code: 'KSA', opponent_name: '사우디아라비아', home: true, date: '2027-03-01', venue: '미정 (중국)', note: '구장·시간 미정', status: 'scheduled' },
];

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const sportId = sport.id;

  await post('/rest/v1/teams?on_conflict=sport_id,name',
    { sport_id: sportId, name: '중국 남자농구 국가대표팀', short_name: '중국', city: 'China',
      extra: { competition: 'FIBA Basketball World Cup 2027 Asian Qualifiers', group: 'F',
        coaching_staff: [{ name: '궈스창(Guo Shiqiang)', role: '감독', since: 2024 }],
        schedule: SCHEDULE, memo: MEMO } },
    { Prefer: 'resolution=merge-duplicates,return=representation' });
  const [team] = await get('/rest/v1/teams?sport_id=eq.' + sportId + '&name=eq.' + encodeURIComponent('중국 남자농구 국가대표팀') + '&select=id');
  console.log('team ok', team.id);

  await req('DELETE', `/rest/v1/players?team_id=eq.${team.id}`);
  const rows = ROSTER.map(([name, jersey, position, GP, MIN, stats, bio]) => ({
    sport_id: sportId, team_id: team.id, name, jersey_number: jersey, position,
    stats: { ...stats, ...(GP != null ? { GP } : {}), ...(MIN != null ? { MIN } : {}) },
    bio,
  }));
  await post('/rest/v1/players', rows);
  console.log('roster ok (' + rows.length + ')');
}

main().catch((e) => { console.error(e); process.exit(1); });
