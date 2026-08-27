// Adds the "Group F Preview: Chaos begins" article to group_news (both teams'
// extra), plus a 이현중-specific background note in player_content sourced from
// that same article's "Players to watch" section.
//
// Usage:  node scripts/patchGroupFPreviewAndLeeReport.js
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
const patch = (path, body) => req('PATCH', path, body);
const post = (path, body) => req('POST', path, body);

const NEWS_ITEM = {
  title: 'F조 프리뷰: 혼돈의 시작',
  date: '2026-08-26',
  url: 'https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/group-f-preview-chaos-begins',
  summary:
    '레바논이 1라운드 5승1패로 선두를 지키고 있지만 일본·카타르가 단 1승 차이고, 한국·중국·사우디는 나란히 3승3패로 순위가 매우 촘촘하다는 프리뷰. 개막전인 레바논-한국(8/27), 일본-사우디(8/28), 중국-레바논(8/31)을 2라운드 판도를 가를 핵심 매치업으로 꼽았다. 한국 관련해서는 데이비슨대 출신 이현중의 대표팀 복귀를 주요 관전 포인트로 소개하며, 사이즈와 슈팅력을 갖춘 그의 외곽 공격이 한국의 상위권 진입에 핵심이 될 것이라 전망했다.',
};

const LEE_REPORT = {
  category: 'background',
  title: '국가대표 복귀 — 데이비슨대 출신 외곽 자원',
  body:
    'FIBA가 윈도우4 F조 프리뷰에서 "주목할 선수"로 소개. 데이비슨대(Davidson) 출신으로 사이즈와 슈팅력, 국제무대 경험을 갖춘 포워드로 평가받았으며, 마지막 순간(일본전 81-79 승리)까지 접전 끝에 2라운드 진출을 확정지은 한국이 상위권(3위 이내)으로 도약하는 데 있어 그의 외곽 슈팅과 득점 창출력이 핵심이 될 것이라고 전망했다.',
  source_urls: ['https://www.fiba.basketball/en/events/fiba-basketball-world-cup-2027-asian-qualifiers/news/group-f-preview-chaos-begins'],
};

async function main() {
  const [sport] = await get('/rest/v1/sports?code=eq.bball_nt&select=id');
  const teams = await get(`/rest/v1/teams?sport_id=eq.${sport.id}&select=id,name,extra`);
  for (const t of teams) {
    const existingNews = Array.isArray(t.extra.group_news) ? t.extra.group_news : [];
    const extra = { ...t.extra, group_news: [NEWS_ITEM, ...existingNews] };
    await patch(`/rest/v1/teams?id=eq.${t.id}`, { extra });
    console.log('news patched', t.name);
  }

  const [lee] = await get('/rest/v1/players?select=id,name&name=eq.' + encodeURIComponent('이현중'));
  await post('/rest/v1/player_content', {
    player_id: lee.id,
    category: LEE_REPORT.category,
    title: LEE_REPORT.title,
    body: LEE_REPORT.body,
    source_urls: LEE_REPORT.source_urls,
  });
  console.log('player_content added for', lee.name);
}

main().catch((e) => { console.error(e); process.exit(1); });
