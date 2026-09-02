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

const TEAM_ID = 'ad84ff6f-4ff6-45c8-a7cf-ea717e7bd86a';

const JERSEY_FIX = {
  '모하메드 알사게르': 7,
  '압둘아지즈 하산 알알라위': 3,
  '함맘 압둘카림 후세인': 88,
  '아흐메드 알무크타르': 13,
};

const MEMOS = {
  '무함마드알리 압둘 라흐크만': `이번 로스터 최대 스토리라인. 미시간대(2014-18) 출신으로 대학 통산 최다출전(144경기) 기록 보유, 2017 스위트16·2018 NCAA 챔피언십 결승 진출, 빅텐 우승 2회. 2018년 드래프트 미지명 후 클리블랜드 G리그(캔턴 차지)를 거쳐 폴란드·이탈리아·터키·스페인을 전전한 저니맨. 빌바오 소속이던 2025년 FIBA 유로컵 우승, 현재 이탈리아 세리에A 트레비소 소속. 10월 요르단전(77-73 승리)에서 25득점 8리바운드 7어시스트 2스틸로 경기 MVP — 사우디의 이번 대회 첫 승을 사실상 혼자 만들었음. 국가대표 자격 취득 배경(귀화 여부)은 공식 소스에서 확인 안 됨 — 방송 중에는 "미국 대학·프로 무대를 거쳐 사우디 대표팀에 합류한 선수"로 소개하는 게 안전, 방송 전 사우디농구협회 발표나 FIBA 공식 바이오 재확인 권장.`,
  '압둘아지즈 하산 알알라위': '알울라 소속. 가드진 중 단신(180cm)이나 슈팅가드로 기용됨.',
  '모하메드 알사게르': '만 40세, 이번 로스터 최고령. 알울라 소속으로 이번 시즌은 출전시간이 크게 줄었지만(6경기 0.3득점) 백업 리더십·경험치로 승선한 베테랑 가드.',
  '아흐메드 알무크타르': '우후드 메디나 소속. 2017년 이집트 아랍선수권 당시 "팀 내 최고의 3점 슈터"로 평가받은 바 있음.',
  '함맘 압둘카림 후세인': '소속팀 미확인. 2025 아시아컵 예선 2경기 출전한 백업 빅맨 자원.',
};

async function main() {
  const players = await get(`/rest/v1/players?team_id=eq.${TEAM_ID}&select=id,name,bio,jersey_number`);

  for (const [name, jersey] of Object.entries(JERSEY_FIX)) {
    const p = players.find((x) => x.name.startsWith(name));
    if (!p) { console.log('SKIP jersey fix (not found):', name); continue; }
    await patch(`/rest/v1/players?id=eq.${p.id}`, { jersey_number: jersey });
    console.log('jersey fixed:', name, '->', jersey);
  }

  for (const [name, memo] of Object.entries(MEMOS)) {
    const p = players.find((x) => x.name.startsWith(name));
    if (!p) { console.log('SKIP memo (not found):', name); continue; }
    const existing = typeof p.bio.memo === 'string' && p.bio.memo.trim() ? p.bio.memo.trim() : null;
    const newMemo = existing ? `${existing}\n\n${memo}` : memo;
    await patch(`/rest/v1/players?id=eq.${p.id}`, { bio: { ...p.bio, memo: newMemo } });
    console.log('memo patched:', name);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
