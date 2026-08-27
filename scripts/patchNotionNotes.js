// Pulls general (non-outdated-stat) background/color content from the user's
// own Notion pages ("2027 월드컵 아시아예선", "선수단", "FIBA 아시아컵 - 레바논")
// into team.extra.memo and player.bio.memo — the simple freeform memo fields,
// not the old episode/background category system.
//
// Usage:  node scripts/patchNotionNotes.js
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

const KOREA_TEAM_MEMO = `[감독 마줄스 스타일] 코트에서 "패스!"를 계속 외치는 전형적 동유럽 스타일 농구. 공수 모두 적극성을 요구하고 터프하고 피지컬한 선수를 선호(문유현, 에디 다니엘 등). 대만·일본 등 상대적으로 신장이 작은 팀엔 이현중·신승민급을 4번으로 쓰는 스몰라인업도 구상 중이라고 언급된 바 있음.

[전력 공백] 하윤기(발목 수술, 시즌아웃), 이원석·강상재·문정현 등 부상/차출 이탈이 있었고, 라건아 은퇴 이후 귀화 빅맨 공백이 여전히 진행형인 이슈.

[역대 성적] 농구 월드컵 통산 19회 출전 중 본선 진출 8회, 통산 10승 36패. 21세기 들어서는 6회 대회 중 2014·2019 단 2회만 본선行(코로나 여파로 한 번은 예선 참여 자체가 불가해 실격).

[한일전 포인트] 2026년 3월 1일(삼일절) 일본전은 "1998년 축구 대표�첨 대결 이후 처음 열리는 삼일절 한일전"이라는 상징성 있음.

[대만 1차전 이후 자아비판] 2라운드 대만전 패배(65-77) 후 마줄스 감독 "팀플레이를 하지 않은 게 가장 큰 문제. 대만이 공을 잘 돌렸고 빈 공간을 더 잘 찾았다", 이현중도 "나를 포함해 선발이 잘못했다. 이번 경기 책임은 나에게 있다"고 언급 — 팀 분위기/책임감을 보여주는 코멘트.

[원정 경기장 트리비아] 중국 원정(베이징 우커송 스포츠 아레나)은 2008 베이징 올림픽 미국 "리딤팀"이 금메달을 딴 바로 그 경기장.`;

const LEBANON_TEAM_MEMO = `[별칭] "시더스(Cedars)" — 레바논의 상징인 삼나무에서 따온 애칭.

[레전드] 파디 엘 카티브 이후 전성기를 다시 맞고 있다는 평가 (2025 아시아컵 기준). 현재 에이스는 와엘 아락지, 디드릭 로슨(귀화, 중국 신장 소속) 콤비.

[선수 구성] 아미르 사우드, 유세프 카얏 등이 서포트. 알리 메즈헤르는 대표팀 예선에서 한 경기 15어시스트로 아시아 예선 신기록을 세운 바 있음(2025 Window3, 인도전).

[감독 변화] 2025 아시아컵 당시 감독은 미오드라그 페리시치였으나, 이후 알 리야디를 이끌던 아흐마드 파란(Ahmad Farran)으로 교체 — 현재 감독.`;

const PLAYER_MEMOS = {
  '이현중': `[일본리그(B리그) 활약] 나가사키 벨카 소속, 시즌 39경기 선발 출전(평균 29분) 17.3점 5.6리바 2.5어시 1.1스틸 0.4블록. 3점 성공/성공률 리그 1위, 팀 득점 2위, 출전시간 리그 1위.
[대표팀 기록] 2025 중국전에서 3점 9개 성공 — 월드컵 예선 단일 경기 최다 3점 기록.
[리더십/책임감] 2라운드 대만전 패배 후 "이번 경기 책임은 나에게 있다"고 직접 언급하는 등 팀의 정신적 지주 역할.`,
  '이승현': `대표팀 주장(captain). 별명 "두목 가자미". 현대모비스에서도 리바운드(공격리바운드 포함)에 강점을 보이는 허슬 플레이어.`,
  '문유현': `2025 신인 드래프트 전체 1순위. 대표팀 합류 직전 리그에서 2경기 연속 20득점(SK전, DB전) 기록. 대학(연세대) 시절 챔피언결정전에서 종료 1초 전 위닝샷을 넣은 경험이 있는 강심장.`,
  '에디 다니엘': `용산고 시절 싱가포르에서 열린 NBA 라이징스타 인비테이셔널(vs 중국 칭화부속고)에서 우승을 견인. 2026 KBL 올스타전 1대1 매치에서 정호영·김건하·정성조를 꺾고 우승.`,
  '여준석': `시애틀대학교 소속으로 시즌 30경기 평균 30분 11.9점 3.9리바 1.5어시. 팀이 NIT 토너먼트 2라운드에서 탈락해 디비전1 토너먼트 진출은 불발 — 대표팀 활동 이후 시애틀대에서 한 시즌 더 뛸 예정.`,
  '변준형': `안양 정관장에서 주장 역할. FA 계약 3년 첫 해 계약금 8억원.`,
  '유기상': `신장(188cm) 대비 윙스팬이 197cm로 매우 긴 편. 2년 연속 KBL 올스타 투표 1위에 오른 인기 스타.`,
  '이우석': `상무(국군체육부대) 소속 군인 신분으로, 현재는 몸을 키우는 데 주력하고 있다고 알려짐.`,
  '장재석': `2026년 window4 소집 기준 4년 만의 대표팀 재승선.`,
  'Wael Arakji': `2021 아시아컵 준우승 당시 대회 MVP. 팀 별명 "시더스"의 현재 에이스.`,
  'Dedric Lawson': `귀화 선수로 중국 CBA 신장 플라잉 타이거스 소속. 레바논의 골밑을 책임지는 핵심 빅맨.`,
  'Ali Mezher': `2025년 인도전에서 한 경기 15어시스트를 기록, 이전까지의 아시아 예선 최다 어시스트 기록(14개)을 경신.`,
};

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const teams = await get(`/rest/v1/teams?sport_id=eq.${sport.id}&select=id,name,extra`);

  const korea = teams.find((t) => t.name === '대한민국 남자농구 국가대표팀');
  if (korea) {
    await patch(`/rest/v1/teams?id=eq.${korea.id}`, { extra: { ...korea.extra, memo: KOREA_TEAM_MEMO } });
    console.log('team memo set: 대한민국');
  }
  const lebanon = teams.find((t) => t.name === '레바논 남자농구 국가대표팀');
  if (lebanon) {
    await patch(`/rest/v1/teams?id=eq.${lebanon.id}`, { extra: { ...lebanon.extra, memo: LEBANON_TEAM_MEMO } });
    console.log('team memo set: 레바논');
  }

  const allPlayers = await get(`/rest/v1/players?sport_id=eq.${sport.id}&select=id,name,bio`);
  for (const [name, memo] of Object.entries(PLAYER_MEMOS)) {
    const p = allPlayers.find((x) => x.name === name);
    if (!p) { console.log('SKIP (player not found)', name); continue; }
    await patch(`/rest/v1/players?id=eq.${p.id}`, { bio: { ...p.bio, memo } });
    console.log('player memo set:', name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
