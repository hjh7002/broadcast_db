// Distributes the researched Saudi Arabia player dossier into each player's
// bio.memo, matched by jersey number to avoid name-spelling ambiguity.
// Appends to any existing memo rather than overwriting.
// Usage: node scripts/patchSaudiPlayerProfiles.js
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

// jersey_number -> memo text
const MEMOS = {
  0: `사우디 최고참 플레이메이커 중 한 명. 알아흘리 제다 소속으로 2024 WASL 걸프리그 6경기 17.7득점 5.7어시스트. 2013년 아시아선수권 때 이미 "사우디 최고의 패스·스틸러"로 꼽혔고, 태국전 20득점 10어시스트 활약 기록 보유. (등번호 "00"이지만 DB엔 0으로 저장 — 오사마 알바르가위와 실제로는 다른 등번호)`,
  // NOTE: jersey 0 is shared in our schema by both #00 Almuwallad and #0 Albargawi — handled by name-based fallback below.
  3: `알울라 소속. 가드진 중 단신(180cm)이나 슈팅가드로 기용됨.`,
  6: `이티하드 클럽 소속. 2025-26시즌 6경기 8.2득점 4.7리바운드.`,
  7: `만 40세, 이번 로스터 최고령. 알울라 소속으로 이번 시즌은 출전시간이 크게 줄었지만(6경기 0.3득점) 백업 리더십·경험치로 승선한 베테랑 가드.`,
  10: `휴먼 스토리 소재 — 수단-모로코계 혼혈로 사우디에서 출생, 캐나다에서 성장·대학 진학. 원래 축구를 하다 캐나다 친구들 따라 농구로 전향, 2018년 사우디 대표팀 합류. 데뷔 당시 코로나 격리 중 "아마존에서 농구공을 주문했다"는 일화가 있고, 바레인전에서 트리플더블을 기록한 적도 있음. 인터뷰: "국가를 대표할 기회를 항상 꿈꿨다", "우리는 가족 같은 분위기."`,
  12: `별명 "Royalty of Rejections"(거절의 왕족). 팀 내 최장신, 2018년 대표팀 데뷔. 2026시즌 알울라에서 6경기 15.0득점 12.2리바운드(EFF 23.8)로 활약 중이고, 아시아컵 예선에서는 23블록으로 전체 1위에 오른 적도 있음. 초창기엔 "과체중·약한 체력"이라는 혹평을 들었으나 이를 동기 삼아 몸을 만들어 지금의 수비형 빅맨이 된 케이스. 양손 슛 블록이 가능한 게 특징. 인터뷰: "이건 알라의 은혜와 동료들 덕분이다."`,
  13: `우후드 메디나 소속. 2017년 이집트 아랍선수권 당시 "팀 내 최고의 3점 슈터"로 평가받은 바 있음.`,
  20: `알아흘리 소속. 2024 WASL 걸프리그 6경기 12.3득점 6.7리바운드로 이번 로스터 중 클럽 기준 효율 상위권(EFF 13.7).`,
  35: `알아흘리 소속. 예선 7경기 출전은 했으나 출전시간은 짧은 편(경기당 6분 남짓) — 11월 인도전 12분 4득점이 최다 출전 기록.`,
  88: `소속팀 미확인. 2025 아시아컵 예선 2경기 출전한 백업 빅맨 자원.`,
};

// jersey 0 is ambiguous in our schema (both #00 and #0 wear "0"), so those two go by name.
const MEMOS_BY_NAME = {
  '마르주크 알무왈라드': `사우디 최고참 플레이메이커 중 한 명. 알아흘리 제다 소속으로 2024 WASL 걸프리그 6경기 17.7득점 5.7어시스트. 2013년 아시아선수권 때 이미 "사우디 최고의 패스·스틸러"로 꼽혔고, 태국전 20득점 10어시스트 활약 기록 보유. 인스타그램 @mrmeezo.`,
  '오사마 알바르가위': `알힐랄 우승 주역 — 알힐랄이 30년 만에 리그 우승(2021-22시즌, 알나스르전 78-70)을 차지할 때 챔피언결정전 10득점 포함 평균 9.0득점 4.3리바운드를 기록. 본인 인터뷰: "해외 클럽과의 국제대회 경험이 중요하다."`,
  '무함마드알리 압두르라흐크만': `이번 로스터 최대 스토리라인. 미시간대(2014-18) 출신으로 대학 통산 최다출전(144경기) 기록 보유, 2017 스위트16·2018 NCAA 챔피언십 결승 진출, 빅텐 우승 2회. 2018년 드래프트 미지명 후 클리블랜드 G리그(캔턴 차지)를 거쳐 폴란드·이탈리아·터키·스페인을 전전한 저니맨. 빌바오 소속이던 2025년 FIBA 유로컵 우승, 현재 이탈리아 세리에A 트레비소 소속. 10월 요르단전(77-73 승리)에서 25득점 8리바운드 7어시스트 2스틸로 경기 MVP — 사우디의 이번 대회 첫 승을 사실상 혼자 만들었음. ⚠️ 국가대표 자격 취득 배경(귀화 여부)은 공식 소스에서 확인 안 됨 — 방송 중에는 "미국 대학·프로 무대를 거쳐 사우디 대표팀에 합류한 선수"로 소개하는 게 안전, 방송 전 사우디농구협회 발표나 FIBA 공식 바이오 재확인 권장.`,
};

async function main() {
  const players = await get(`/rest/v1/players?team_id=eq.${TEAM_ID}&select=id,name,jersey_number,bio`);

  for (const [name, memo] of Object.entries(MEMOS_BY_NAME)) {
    const p = players.find((x) => x.name.startsWith(name));
    if (!p) { console.log('SKIP by-name (not found):', name); continue; }
    const existing = typeof p.bio.memo === 'string' && p.bio.memo.trim() ? p.bio.memo.trim() : null;
    const newMemo = existing ? `${existing}\n\n${memo}` : memo;
    await patch(`/rest/v1/players?id=eq.${p.id}`, { bio: { ...p.bio, memo: newMemo } });
    console.log('patched (by name)', p.name);
  }

  for (const [jersey, memo] of Object.entries(MEMOS)) {
    const j = Number(jersey);
    const candidates = players.filter((x) => x.jersey_number === j);
    // skip the ambiguous jersey-0 group here; already handled by name above
    const p = candidates.find((x) => !x.name.startsWith('마르주크') && !x.name.startsWith('오사마'));
    if (!p) { console.log('SKIP jersey (not found):', jersey); continue; }
    const existing = typeof p.bio.memo === 'string' && p.bio.memo.trim() ? p.bio.memo.trim() : null;
    const newMemo = existing ? `${existing}\n\n${memo}` : memo;
    await patch(`/rest/v1/players?id=eq.${p.id}`, { bio: { ...p.bio, memo: newMemo } });
    console.log('patched (jersey', jersey + ')', p.name);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
