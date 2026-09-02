// The 12-man World Cup Qualifying Tournament roster (populateWomenNationalTeam.js)
// was NOT the actual World Cup squad. Korea qualified in March, but the
// federation announced a separate final 12 for the actual 2026 FIBA Women's
// Basketball World Cup (Berlin, 2026-09-04~13) on 2026-08-25:
//   - Jisu Park (박지수) OUT: post-surgery rehab.
//   - Hyun Jeong (정현, Hana Bank) IN: first senior call-up, covering for
//     Jihyun Park's Japan-exhibition absence.
//   - Jihyun Park now plays for LA Sparks (WNBA), joins the squad late (9/1,
//     in Germany) due to her WNBA schedule.
//   - Leeseul Kang moved teams via FA (KB Stars -> Asan Woori Bank, 2026-05-08).
// The World Cup itself is a different competition from the March Qualifying
// Tournament: Korea is in Group B with Hungary/Nigeria/France (not the
// qualifying A-group of France/Germany/Nigeria/Colombia/Philippines).
// Sources: isplus.com/article/view/isp202608250052, newsis.com
// (NISX20260825_0003761419), jumpball.co.kr (Hyun Jeong profile), Wikipedia
// "2026 FIBA Women's Basketball World Cup Group B".
// Usage: node scripts/updateWomenTeamToWorldCupRoster.js
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
const post = (path, body) => req('POST', path, body);

const SPORT_ID = '10f7ec62-38a4-44b2-8918-141941c5191f';
const TEAM_ID = '498d9fbb-cdb2-4d21-941d-23fc1414d84d';

const IDS = {
  박지현: 'f92cf976-10ba-40c1-b04f-baa760c0811b',
  허예은: 'af0a2f13-f69f-4de6-b80b-2da605f60a49',
  강이슬: '1deda4af-32bd-4832-beee-60d400f514cc',
  박지수: 'f4874622-b226-41d1-b1c2-2a0d023bb5e8',
  안혜지: 'd5785f23-fd82-46cd-91cd-7de7d3538fb9',
  최이샘: '10ce2789-3cc9-4263-a4ea-ffac243f1771',
  이소희: 'b514855f-9c2e-431a-a480-6e1bcd3a3e3f',
  강유림: 'b93fc1a7-9321-4655-849a-d11b9056ee0b',
  홍유순: 'f8d4cd72-d581-4601-9bc5-fd4c24b9e03e',
  박소희: '7cec861b-b289-4c09-96d0-447d5ec79df0',
  진안: 'aa1261fd-339a-48b3-a77b-fc5c90207271',
  이해란: '4b658017-bd0c-487b-9fbb-f212240d927c',
};

async function main() {
  const [team] = await get(`/rest/v1/teams?id=eq.${TEAM_ID}&select=extra`);
  const extra = team.extra;

  // 1. Append the World Cup Group B games to the schedule (qualifying games stay as history)
  const GAME_BASE = 'https://www.fiba.basketball/en/events/fiba-womens-basketball-world-cup-2026/games/';
  extra.schedule.push(
    {
      date: '2026-09-04', home: true, round: '월드컵 조별리그(B조)', venue: 'Berlin Arena, Berlin (독일)',
      note: '한국시간 9/4(금) 21:30 킥오프 (현지 14:15)', status: 'scheduled',
      opponent_code: 'NGR', opponent_name: '나이지리아',
    },
    {
      date: '2026-09-06', home: false, round: '월드컵 조별리그(B조)', venue: 'Max-Schmeling-Halle, Berlin (독일)',
      note: '한국시간 9/6(일) 03:45 킥오프 (현지 9/5 20:45)', status: 'scheduled',
      opponent_code: 'FRA', opponent_name: '프랑스',
    },
    {
      date: '2026-09-07', home: false, round: '월드컵 조별리그(B조)', venue: 'Max-Schmeling-Halle, Berlin (독일)',
      note: '한국시간 9/7(월) 21:30 킥오프 (현지 14:30)', status: 'scheduled',
      opponent_code: 'HUN', opponent_name: '헝가리',
    },
  );

  // 2. Competition/group metadata: keep qualifying A-group as history, add World Cup B-group
  extra.competition = 'FIBA Women\'s Basketball World Cup 2026 Qualifying Tournament (Villeurbanne, France) → 2026 FIBA Women\'s Basketball World Cup (Berlin, Germany)';
  extra.wc_group = 'B';
  extra.wc_group_teams = ['대한민국', '헝가리', '나이지리아', '프랑스'];
  extra.wc_format = '조 1위 8강 직행 / 2·3위 플레이인(승자 8강 진출) / 4위 탈락';
  extra.wc_venue = 'Berlin Arena / Max-Schmeling-Halle, Berlin, Germany';

  // 3. final_roster_ids: the actual 12-man World Cup squad (excludes Jisu Park)
  extra.final_roster_ids = [
    IDS.박지현, IDS.허예은, IDS.강이슬, IDS.안혜지, IDS.최이샘, IDS.이소희,
    IDS.강유림, IDS.박소희, IDS.이해란, IDS.홍유순, IDS.진안,
    // Hyun Jeong (정현) added below as a new player row.
  ];

  extra.memo = extra.memo + '\n\n' +
    '[2026 월드컵 본선 로스터 변경] 3월 최종예선 12인 명단과 실제 월드컵(9/4~13, 독일 베를린) 로스터는 다르다 — ' +
    '2026-08-25 협회 발표: 박지수(수술 후 재활)가 제외되고, 정현(하나은행, 첫 성인대표 발탁)이 박지현의 일본 평가전 공백을 메우며 승선. ' +
    '박지현은 WNBA 로스앤젤레스 스파크스 소속으로 시즌 일정상 일본 원정(8/13·14, 2연패)에는 불참했고 9/1 독일 현지에서 뒤늦게 합류. ' +
    '강이슬은 2026-05-08 FA로 KB스타즈에서 아산 우리은행으로 이적(4년 16.8억원).\n' +
    '본선 조편성: B조(헝가리·나이지리아·프랑스). 조 1위만 8강 직행, 2·3위는 플레이인 승자가 8강行, 4위 탈락. ' +
    '첫 경기 나이지리아전(9/4) 앞두고 진천선수촌 강화훈련 + 일본 평가전 2연전(2패)으로 담금질.';

  await patch(`/rest/v1/teams?id=eq.${TEAM_ID}`, { extra });
  console.log('team updated');

  // 4. Player bio updates
  await patch(`/rest/v1/players?id=eq.${IDS.강이슬}`, {
    bio: { height_cm: 180, birthdate: '1994-04-05', club: '아산 우리은행',
      memo: '대표팀 주장, 2025 아시아컵 주전 슈터. 2026-05-08 FA로 KB스타즈에서 우리은행으로 이적(4년 16.8억원). 최종예선 독일전(1차전) 22분 11점(3점 2개). 필리핀전에서 3점 8개(24득점)를 몰아넣으며 최종예선 평균 18.6점으로 팀 내 최다득점 — 월드컵 본선에서도 주 득점원.' },
  });
  await patch(`/rest/v1/players?id=eq.${IDS.박지현}`, {
    bio: { height_cm: 185, birthdate: '2000-04-07', club: 'LA 스파크스 (WNBA)',
      memo: '국대 경력: 2018~ (도쿄 올림픽, 아시아컵). 2025 아시아컵 베스트5. WNBA 로스앤젤레스 스파크스 소속으로 시즌 일정상 8월 일본 평가전에는 불참, 9/1 독일 현지에서 대표팀에 뒤늦게 합류. 최종예선 평균 11.4점/4.2리바/2.2어시로 팀 내 득점 2위.' },
  });
  await patch(`/rest/v1/players?id=eq.${IDS.박지수}`, {
    bio: { height_cm: 198, birthdate: '1998-12-06', club: '청주 KB (구 KB스타즈)',
      memo: '최연소 국대 출신, 대표팀 12년 차 부동의 센터. 최종예선 평균 8.4점/6.6리바/2.0블록(팀 내 1위)으로 대회 내내 더블더블을 노리는 활약을 펼쳤으나, 수술 후 재활을 이유로 2026 월드컵 본선(9/4~13, 독일 베를린) 최종 12인에서는 제외됐다.' },
  });

  // 5. Add Hyun Jeong (정현) — first senior national team call-up
  const [hyun] = await post('/rest/v1/players', {
    sport_id: SPORT_ID, team_id: TEAM_ID, name: '정현 Hyun Jeong', position: '포워드',
    jersey_number: null,
    bio: {
      height_cm: 178, birthdate: '2006-08-13', club: '부천 하나은행',
      memo: '2024 WKBL 신인 드래프트 1라운드 3순위(하나은행). 프로 2년 차 시즌 정규리그 30경기 평균 27분·6.3점/3.4리바/1.0어시, 하나은행의 정규리그 2위에 기여. 박수호 감독이 "슈팅력과 신장을 갖췄다"고 평가하며 박지현의 일본 평가전 공백 대비로 발탁 — 2026 월드컵 본선(9/4~13)이 성인 대표팀 데뷔 무대.',
    },
    stats: { GP: 30, MIN: 27.3, PTS: 6.3, REB: 3.4, AST: 1.0 },
  });
  console.log('player created', hyun.name, hyun.id);

  const [team2] = await get(`/rest/v1/teams?id=eq.${TEAM_ID}&select=extra`);
  const finalIds = [...team2.extra.final_roster_ids, hyun.id];
  await patch(`/rest/v1/teams?id=eq.${TEAM_ID}`, { extra: { ...team2.extra, final_roster_ids: finalIds } });
  console.log('final_roster_ids finalized:', finalIds.length, '/ 12');
}

main().catch((e) => { console.error(e); process.exit(1); });
