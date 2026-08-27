// Adds Wikipedia-sourced background info (career history, college, birthplace, etc.)
// to 8 Lebanon players' bio.memo — only the parts NOT already captured by structured
// fields (birthdate/height_cm/club already exist, so those aren't repeated here).
// Amir Saoud and Ali Mezher already have an operational memo note, so their new text
// is APPENDED rather than overwriting.
//
// Usage: node scripts/patchLebanonWikiBios.js
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

const NEW_INFO = {
  'DJ Funderburk': `본명 Derek Funderburk Jr. 오하이오주 클리블랜드 하이츠 출신. 노스웨스트 플로리다 주립대(JUCO)를 거쳐 NC State 졸업. 2021 NBA 드래프트 미지명 후 유타 재즈 서머리그 참가, 이후 러시아(아브토도르)·프랑스(파리 바스켓볼)·이탈리아(레조 에밀리아)·이스라엘(하포엘 에일랏)·폴란드(안빌 브워츠와베크)·그리스(이라클리스, 미코노스) 등 유럽 각지를 거친 저니맨형 귀화 센터/파워포워드.`,
  'Amir Saoud': `베이루트 출신, 83kg. 슈팅가드/포인트가드. 2010년 훕스(Hoops)에서 데뷔해 커리어 대부분을 알 리야디에서 보낸 베테랑. BCL 아시아(FIBA 아시아 챔피언스컵) 우승 3회(2011, 2017, 2024) 경력.`,
  'Karim Zeinoun': `베이루트 출신. 호멘트멘과 알 리야디에서 활약하며 레바논 리그·컵대회 다수 우승. 2022 FIBA 아시아컵 준우승, 2022 아랍 챔피언십 우승 멤버.`,
  'Jad Khalil': `주크 미카엘 출신. 알 사제스 주전 포인트가드. 2022 아랍 농구 챔피언십(두바이) 우승 멤버.`,
  'Sergio El Darwich': `베이루트 클럽 소속으로 뛰던 시절 레바논 리그 우승(2021-22)과 컵대회 우승을 주도. 2022 FIBA 아시아컵 준우승 멤버. (참고: 우리 DB엔 현재 소속이 Sendai 89ers(일본 B리그)로 되어있는데, 이번에 받은 정보엔 소속팀이 Beirut Club으로 되어 있어요 — 이적 시점 확인이 필요할 수 있습니다.)`,
  'Youssef Khayat': `프랑스 리모주 CSP 유스·성인팀(2018-2022) → NCAA 미시간 대학교(2022-2024) → 볼링그린 주립대(2024-2025)를 거쳐 2025년 알 사제스 합류. 연령별 대표팀 출신, 2022 FIBA 아시아컵 은메달 멤버.`,
  'Hayk Gyokchyan': `아르메니아 예레반 출신, 97kg, 아르메니아계 레바논인. 미국 프랭클린 & 마셜 칼리지(2009-2013) 졸업. 호멘트멘·사제스·베이루트 클럽·알 리야디 등 레바논 명문 클럽을 두루 거침. 2022 FIBA 아시아컵 준우승 멤버.`,
  'Ali Mezher': `베이루트 출신. 2013년부터 레바논 리그(알 사제스)에서 활약. 2017 서아시아 농구 선수권(WABA) 우승 멤버.`,
};

async function main() {
  const players = await get('/rest/v1/players?team_id=eq.2e5c9f10-816c-4bb8-bf7a-b5b4d95df61f&select=id,name,bio');
  for (const [enName, info] of Object.entries(NEW_INFO)) {
    const p = players.find((x) => x.name.includes(enName));
    if (!p) { console.log('SKIP (not found):', enName); continue; }
    const existingMemo = typeof p.bio.memo === 'string' && p.bio.memo.trim() ? p.bio.memo.trim() : null;
    const newMemo = existingMemo ? `${existingMemo}\n\n${info}` : info;
    await patch('/rest/v1/players?id=eq.' + p.id, { bio: { ...p.bio, memo: newMemo } });
    console.log('patched', p.name, existingMemo ? '(appended)' : '(new)');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
