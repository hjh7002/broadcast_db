// Completes the Saudi Arabia team memo (extra.memo was cut off at "다니엘
// 마페이 감독 : 아르헨티나 출신, ") and adds bio.memo for the 6 most notable
// Saudi Arabia players. Sourced from FIBA news articles (game reports,
// coach quotes), Wikipedia (Daniel Maffei), and the box-score data already
// pulled into scripts/patchSaudiGameLogs.js. Fetches existing extra/bio and
// spreads before PATCH so schedule/coaching_staff/group_standings and
// existing bio fields (club/birthdate/height_cm) are preserved.
//
// Usage:  node scripts/patchSaudiMemo.js
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';
const TEAM_ID = 'ad84ff6f-4ff6-45c8-a7cf-ea717e7bd86a';

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

const TEAM_MEMO = `[감독 스타일] 다니엘 마페이 감독(아르헨티나, 1959년생)은 사우디아라비아 농구와 인연이 깊은 지도자다. 2006-07시즌 알 이티하드 제다(Al Ittihad Jeddah)를 이끌고 사우디 프리미어리그·알누크바 챔피언십·파이살 왕자컵을 싹쓸이하는 트레블을 달성했고, 같은 해 사우디아라비아 대표팀 지휘봉을 잡아 카타르에서 열린 걸프네이션스컵 결승까지 올랐다. 이후 멕시코·베네수엘라·스페인·카타르·요르단·도미니카공화국·UAE 등을 두루 거친 국제파 지도자로, 이번 월드컵 예선에서 20년 만에 사우디 대표팀에 복귀한 셈이다.

[지휘봉 교체] 1라운드 도중 벤치에 변화가 있었던 점도 눈여겨볼 대목. 2026년 2월 레바논 원정(64-94 대패) 당시에는 알산하니(Ali Alsanhani) 감독이 지휘봉을 잡았고, 경기 후 "센터 두 명이 부상으로 빠져 작은 라인업으로 승부를 걸었다. 선수들의 노력에는 만족한다"고 밝혔다 — 당시 모하메드 알마르와니가 부상으로, 2025 아시안컵 리바운드 1위 모하메드 알수와일렘도 함께 결장하며 팀은 리바운드에서 32-57로 크게 밀렸다. 이후 6~7월 윈도우부터 마페이 감독 체제로 전환된 것으로 파악된다.

[에이스] 무함마드-알리 압두르-라흐크만(미국 펜실베이니아주 앨런타운 출신, 미시간대 졸업)은 미국·사우디 복수국적 선수로 이번 예선 평균 21.8득점을 책임지는 팀의 절대적 1옵션. 카타르 원정에서 28득점, 인도 원정에서 24득점을 몰아치는 등 매 경기 20점 안팎을 꾸준히 넣었고, 2025 아시안컵에서도 사우디 대표팀 득점 1위에 올랐다.

[전력 공백과 복귀] 신규 소집된 센터 모하메드 알마르와니는 2026년 2월 부상으로 이탈해 이번 예선 6경기에 단 한 번도 출전하지 못했는데, 부상에서 회복해 이번 2라운드(대 한국·일본·중국) 명단에 다시 이름을 올렸다. 반면 1라운드 초반 3경기(인도 2연전·레바논 원정)에서 평균 12.7득점 2.3어시스트로 힘을 보탰던 마르주크 알무왈라드는 6~7월 윈도우부터는 명단에서 빠진 상태다.

[한·중·일과의 순위 다툼] 사우디아라비아는 1라운드를 3승 3패로 마감했다. 이는 한국·중국과 정확히 같은 승패 마진으로, 2라운드에서 한국(8/28 이후 원정·홈 2연전)·일본(홈·원정 각 1경기)·중국(홈·원정 각 1경기)과 추가로 6경기를 치러 최종 진출권을 다툰다.

[걸프 라이벌전의 이변] 7월 초 제다에서 열린 카타르전에서는 지네 베드리(Zine Bedri)에게 4쿼터에만 10득점을 내주며 73-76으로 역전패했다. 이는 양국의 공식 대회 역대 맞대결에서 카타르가 거둔 첫 승(그 이전까지 사우디가 4전 전승)으로 기록된 상징적인 경기였다 — 걸프 라이벌 사이에서도 이변이 속출하는 예선임을 보여주는 장면.`;

const PLAYER_MEMOS = {
  'Muhammad-Ali Abdur-Rahkman': `미국 펜실베이니아주 앨런타운 출신으로 미시간대(Michigan Wolverines)를 거친 미국·사우디 복수국적 선수. 이번 예선 평균 21.8득점으로 팀 내 유일한 20점대 옵션이며, 카타르 원정(2026-06-29)에서 28득점(3점 6/8)을 몰아치며 승리를 이끌었다. 2025 아시안컵에서도 사우디 대표팀 득점 1위에 올랐다.`,
  'Mohammed Alsuwailem': `제다 인근 클럽 알울라(Alula) 소속 센터. 2025 아시안컵 리바운드 1위 출신으로 이번 예선에서도 평균 15.8득점 11.2리바운드의 더블더블을 유지 중이며, 카타르전(6/29)·레바논전(7/3)에서 나란히 개인 최고 EFF 35를 기록했다. 다만 2026년 2월 레바논 원정에는 결장했고, 그 경기에서 팀은 리바운드 32-57로 크게 밀리며 대패했다.`,
  'Khalid Abdel Gabar': `알힐랄(Alhilal) 소속의 1990년생 베테랑 가드로, FIBA 박스스코어 상 대표팀 주장으로 표기된다. 이번 예선 평균 5.0어시스트로 팀 내 최다 어시스트를 책임지며, 카타르 원정(6/29)에서는 8어시스트를 몰아쳤다.`,
  'Mohammed Almarwani': `센터 자원으로, 2026년 2월 레바논 원정을 앞두고 부상을 당해 이번 예선 6경기에 한 번도 출전하지 못했다. 알수와일렘과 함께 골밑을 지켜야 할 빅맨이 한꺼번에 이탈하면서 사우디는 그 경기에서 리바운드 32-57로 완패한 바 있다. 부상에서 회복해 이번 2라운드(한국·일본·중국전) 명단에 다시 이름을 올렸다.`,
  'Marzouq Almuwallad': `1라운드 초반 3경기(인도 2연전, 레바논 원정)에서 평균 12.7득점 2.3어시스트로 힘을 보탰지만, 카타르·레바논을 상대한 6~7월 홈·원정 윈도우 명단에서는 빠진 상태다.`,
  'Musab Tariq M Kadi': `등번호 99번의 다재다능한 포워드. 이번 예선 6경기 전 경기에 출전했으며, 개막전 인도전(11/27)에서 4스틸, 인도 원정(11/30)에서 3스틸을 걷어내는 등 수비에서도 존재감이 뚜렷하다.`,
};

async function main() {
  const [team] = await get(`/rest/v1/teams?id=eq.${TEAM_ID}&select=extra`);
  await patch(`/rest/v1/teams?id=eq.${TEAM_ID}`, { extra: { ...team.extra, memo: TEAM_MEMO } });
  console.log('team memo set: 사우디아라비아');

  const players = await get(`/rest/v1/players?team_id=eq.${TEAM_ID}&select=id,name,bio`);
  for (const [name, memo] of Object.entries(PLAYER_MEMOS)) {
    const p = players.find((x) => x.name === name);
    if (!p) { console.log('SKIP (player not found)', name); continue; }
    await patch(`/rest/v1/players?id=eq.${p.id}`, { bio: { ...p.bio, memo } });
    console.log('player memo set:', name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
