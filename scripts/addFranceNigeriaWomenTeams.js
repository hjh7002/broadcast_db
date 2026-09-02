// Builds France and Nigeria women's national team rosters (the two Qualifying
// Tournament opponents Korea will face again in the actual World Cup Group B,
// along with Hungary). Rosters/bios sourced from the user's Notion pages
// ("프랑스 선수단", "나이지리아 선수단"). Individual box scores for the two
// Korea games (KOR-NGR 2026-03-12, KOR-FRA 2026-03-18) were pulled from FIBA
// and cross-checked against each game's team AST total before use, then used
// to populate GAME_LOG entries on both sides so the H2H floating-card feature
// works bidirectionally for these matchups.
// Usage: node scripts/addFranceNigeriaWomenTeams.js
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
const KOR_TEAM_ID = '498d9fbb-cdb2-4d21-941d-23fc1414d84d';

const KOR_IDS = {
  박지현: 'f92cf976-10ba-40c1-b04f-baa760c0811b', 허예은: 'af0a2f13-f69f-4de6-b80b-2da605f60a49',
  강이슬: '1deda4af-32bd-4832-beee-60d400f514cc', 박지수: 'f4874622-b226-41d1-b1c2-2a0d023bb5e8',
  안혜지: 'd5785f23-fd82-46cd-91cd-7de7d3538fb9', 최이샘: '10ce2789-3cc9-4263-a4ea-ffac243f1771',
  이소희: 'b514855f-9c2e-431a-a480-6e1bcd3a3e3f', 강유림: 'b93fc1a7-9321-4655-849a-d11b9056ee0b',
  홍유순: 'f8d4cd72-d581-4601-9bc5-fd4c24b9e03e', 박소희: '7cec861b-b289-4c09-96d0-447d5ec79df0',
  진안: 'aa1261fd-339a-48b3-a77b-fc5c90207271', 이해란: '4b658017-bd0c-487b-9fbb-f212240d927c',
};

// row: [MIN(mm:ss)|null, PTS, FGM,FGA, P2M,P2A, P3M,P3A, FTM,FTA, OREB,DREB,REB,AST,PF,TO,STL,BLK, PM, EFF]
function gameLogEntry(opp, date, rd, row) {
  if (row.dnp) return null;
  const [mm, ss] = row.min.split(':').map(Number);
  const min = mm + (ss >= 30 ? 1 : 0); // nearest minute, matches how FIBA/box totals round
  const pct = (m, a) => (a > 0 ? Math.round((m / a) * 1000) / 10 : a === 0 ? null : 0);
  return {
    opp, date, rd, MIN: min, PTS: row.pts,
    FGM: row.fgm, FGA: row.fga, FGP: pct(row.fgm, row.fga),
    P2M: row.p2m, P2A: row.p2a, P2P: pct(row.p2m, row.p2a),
    P3M: row.p3m, P3A: row.p3a, P3P: pct(row.p3m, row.p3a),
    FTM: row.ftm, FTA: row.fta, FTP: pct(row.ftm, row.fta),
    OREB: row.oreb, DREB: row.dreb, REB: row.reb, AST: row.ast,
    PF: row.pf, TO: row.to, STL: row.stl, BLK: row.blk, PM: row.pm, EFF: row.eff,
  };
}

// ---- KOR vs NGR box score, 2026-03-12, 조별리그 (checksum: team AST 29/15 verified) ----
const KOR_VS_NGR = {
  박지현: { min: '29:14', pts: 22, fgm: 8, fga: 13, p2m: 5, p2a: 8, p3m: 3, p3a: 5, ftm: 3, fta: 5, oreb: 0, dreb: 6, reb: 6, ast: 4, pf: 2, to: 2, stl: 1, blk: 0, pm: 17, eff: 24 },
  허예은: { min: '18:37', pts: 2, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 2, fta: 2, oreb: 1, dreb: 1, reb: 2, ast: 8, pf: 2, to: 0, stl: 1, blk: 0, pm: 17, eff: 12 },
  강이슬: { min: '33:46', pts: 20, fgm: 7, fga: 21, p2m: 2, p2a: 2, p3m: 5, p3a: 19, ftm: 1, fta: 1, oreb: 0, dreb: 1, reb: 1, ast: 3, pf: 4, to: 3, stl: 1, blk: 0, pm: 11, eff: 8 },
  안혜지: { min: '21:23', pts: 5, fgm: 2, fga: 4, p2m: 1, p2a: 1, p3m: 1, p3a: 3, ftm: 0, fta: 0, oreb: 0, dreb: 2, reb: 2, ast: 3, pf: 4, to: 2, stl: 2, blk: 0, pm: 0, eff: 8 },
  최이샘: { min: '25:19', pts: 0, fgm: 0, fga: 8, p2m: 0, p2a: 2, p3m: 0, p3a: 6, ftm: 0, fta: 0, oreb: 2, dreb: 3, reb: 5, ast: 3, pf: 1, to: 1, stl: 1, blk: 0, pm: -2, eff: 0 },
  박지수: { min: '27:31', pts: 11, fgm: 3, fga: 6, p2m: 3, p2a: 6, p3m: 0, p3a: 0, ftm: 5, fta: 7, oreb: 4, dreb: 6, reb: 10, ast: 4, pf: 4, to: 2, stl: 0, blk: 4, pm: 21, eff: 22 },
  이소희: { dnp: true },
  강유림: { min: '04:54', pts: 3, fgm: 1, fga: 1, p2m: 0, p2a: 0, p3m: 1, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 1, pf: 1, to: 0, stl: 0, blk: 0, pm: -2, eff: 4 },
  박소희: { min: '01:59', pts: 0, fgm: 0, fga: 1, p2m: 0, p2a: 0, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 1, pf: 0, to: 0, stl: 0, blk: 0, pm: 0, eff: 0 },
  이해란: { min: '20:49', pts: 6, fgm: 2, fga: 5, p2m: 1, p2a: 1, p3m: 1, p3a: 4, ftm: 1, fta: 2, oreb: 1, dreb: 3, reb: 4, ast: 2, pf: 2, to: 0, stl: 1, blk: 0, pm: 17, eff: 9 },
  홍유순: { min: '02:07', pts: 0, fgm: 0, fga: 0, p2m: 0, p2a: 0, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: 0, eff: 0 },
  진안: { min: '14:21', pts: 8, fgm: 3, fga: 5, p2m: 3, p2a: 5, p3m: 0, p3a: 0, ftm: 2, fta: 2, oreb: 1, dreb: 0, reb: 1, ast: 0, pf: 1, to: 0, stl: 1, blk: 2, pm: 6, eff: 10 },
};
const NGR_VS_KOR = {
  'Amy Okonkwo': { jersey: 0, min: '18:38', pts: 3, fgm: 1, fga: 6, p2m: 1, p2a: 4, p3m: 0, p3a: 2, ftm: 1, fta: 2, oreb: 2, dreb: 3, reb: 5, ast: 1, pf: 1, to: 0, stl: 0, blk: 0, pm: -15, eff: 3 },
  'Pallas Kunaiyi-Akpanah': { jersey: 3, min: '11:30', pts: 2, fgm: 0, fga: 4, p2m: 0, p2a: 3, p3m: 0, p3a: 1, ftm: 2, fta: 2, oreb: 2, dreb: 1, reb: 3, ast: 0, pf: 0, to: 1, stl: 0, blk: 0, pm: -11, eff: 0 },
  'Elizabeth Balogun': { jersey: 4, min: '18:11', pts: 1, fgm: 0, fga: 4, p2m: 0, p2a: 2, p3m: 0, p3a: 2, ftm: 1, fta: 2, oreb: 0, dreb: 1, reb: 1, ast: 1, pf: 5, to: 1, stl: 2, blk: 1, pm: -1, eff: 0 },
  'Sarah Ogoke': { jersey: 7, min: '02:09', pts: 0, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 1, to: 0, stl: 0, blk: 0, pm: -1, eff: -1 },
  'Ifunanya Okoro': { jersey: 9, min: '17:53', pts: 6, fgm: 3, fga: 5, p2m: 3, p2a: 3, p3m: 0, p3a: 2, ftm: 0, fta: 0, oreb: 0, dreb: 4, reb: 4, ast: 2, pf: 2, to: 2, stl: 0, blk: 0, pm: -5, eff: 8 },
  'Promise Amukamara': { jersey: 10, min: '30:49', pts: 5, fgm: 2, fga: 8, p2m: 1, p2a: 3, p3m: 1, p3a: 5, ftm: 0, fta: 0, oreb: 1, dreb: 2, reb: 3, ast: 4, pf: 2, to: 2, stl: 0, blk: 0, pm: -6, eff: 4 },
  'Murjanatu Musa': { jersey: 20, min: '28:30', pts: 10, fgm: 5, fga: 8, p2m: 5, p2a: 8, p3m: 0, p3a: 0, ftm: 0, fta: 1, oreb: 1, dreb: 3, reb: 4, ast: 0, pf: 1, to: 4, stl: 2, blk: 1, pm: -6, eff: 9 },
  'Blessing Ejiofor': { jersey: 22, dnp: true },
  'Ezinne Kalu': { jersey: 23, min: '29:44', pts: 7, fgm: 1, fga: 7, p2m: 1, p2a: 5, p3m: 0, p3a: 2, ftm: 5, fta: 6, oreb: 1, dreb: 2, reb: 3, ast: 5, pf: 4, to: 3, stl: 1, blk: 0, pm: -16, eff: 6 },
  'Victoria Macaulay': { jersey: 25, min: '26:52', pts: 22, fgm: 8, fga: 13, p2m: 5, p2a: 10, p3m: 3, p3a: 3, ftm: 3, fta: 4, oreb: 1, dreb: 5, reb: 6, ast: 2, pf: 3, to: 5, stl: 0, blk: 0, pm: -10, eff: 19 },
  'Rita Igbokwe': { jersey: 32, min: '04:39', pts: 2, fgm: 1, fga: 2, p2m: 1, p2a: 2, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 3, dreb: 2, reb: 5, ast: 0, pf: 0, to: 0, stl: 0, blk: 0, pm: -5, eff: 6 },
  'Nicole Enabosi': { jersey: 33, min: '11:05', pts: 2, fgm: 1, fga: 4, p2m: 1, p2a: 4, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 2, dreb: 3, reb: 5, ast: 0, pf: 0, to: 0, stl: 0, blk: 0, pm: -9, eff: 4 },
};

// ---- KOR vs FRA box score, 2026-03-18, 조별리그 (checksum: team AST 22/26 verified) ----
const KOR_VS_FRA = {
  박지현: { min: '30:47', pts: 5, fgm: 2, fga: 7, p2m: 1, p2a: 4, p3m: 1, p3a: 3, ftm: 0, fta: 0, oreb: 1, dreb: 4, reb: 5, ast: 2, pf: 3, to: 1, stl: 2, blk: 0, pm: -10, eff: 8 },
  허예은: { min: '21:00', pts: 5, fgm: 2, fga: 5, p2m: 1, p2a: 1, p3m: 1, p3a: 4, ftm: 0, fta: 0, oreb: 0, dreb: 3, reb: 3, ast: 5, pf: 2, to: 2, stl: 1, blk: 0, pm: -21, eff: 9 },
  강이슬: { min: '28:22', pts: 17, fgm: 6, fga: 13, p2m: 1, p2a: 2, p3m: 5, p3a: 11, ftm: 0, fta: 0, oreb: 1, dreb: 4, reb: 5, ast: 0, pf: 3, to: 1, stl: 0, blk: 0, pm: -21, eff: 14 },
  안혜지: { min: '19:00', pts: 4, fgm: 2, fga: 2, p2m: 2, p2a: 2, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 1, dreb: 0, reb: 1, ast: 5, pf: 2, to: 3, stl: 2, blk: 0, pm: -6, eff: 9 },
  최이샘: { min: '19:14', pts: 14, fgm: 5, fga: 7, p2m: 1, p2a: 1, p3m: 4, p3a: 6, ftm: 0, fta: 0, oreb: 1, dreb: 2, reb: 3, ast: 0, pf: 0, to: 1, stl: 1, blk: 0, pm: -6, eff: 15 },
  박지수: { min: '29:11', pts: 3, fgm: 1, fga: 10, p2m: 1, p2a: 7, p3m: 0, p3a: 3, ftm: 1, fta: 2, oreb: 0, dreb: 3, reb: 3, ast: 7, pf: 2, to: 6, stl: 1, blk: 3, pm: -12, eff: 1 },
  이소희: { min: '13:47', pts: 8, fgm: 3, fga: 6, p2m: 3, p2a: 4, p3m: 0, p3a: 2, ftm: 2, fta: 2, oreb: 1, dreb: 0, reb: 1, ast: 0, pf: 2, to: 1, stl: 0, blk: 0, pm: -20, eff: 5 },
  강유림: { min: '06:30', pts: 0, fgm: 0, fga: 0, p2m: 0, p2a: 0, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 1, dreb: 0, reb: 1, ast: 1, pf: 0, to: 0, stl: 1, blk: 0, pm: -6, eff: 3 },
  박소희: { min: '03:20', pts: 0, fgm: 0, fga: 1, p2m: 0, p2a: 0, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 0, to: 0, stl: 1, blk: 0, pm: 1, eff: 0 },
  이해란: { min: '11:43', pts: 2, fgm: 1, fga: 6, p2m: 1, p2a: 5, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 0, pf: 2, to: 2, stl: 0, blk: 0, pm: -5, eff: -5 },
  홍유순: { min: '04:31', pts: 0, fgm: 0, fga: 1, p2m: 0, p2a: 1, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 0, reb: 0, ast: 1, pf: 2, to: 0, stl: 1, blk: 0, pm: -14, eff: 1 },
  진안: { min: '12:35', pts: 4, fgm: 2, fga: 6, p2m: 2, p2a: 6, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 0, dreb: 1, reb: 1, ast: 1, pf: 2, to: 2, stl: 1, blk: 0, pm: -15, eff: 1 },
};
const FRA_VS_KOR = {
  'Alexia Chery': { jersey: 6, min: '16:37', pts: 2, fgm: 1, fga: 4, p2m: 1, p2a: 3, p3m: 0, p3a: 1, ftm: 0, fta: 0, oreb: 0, dreb: 3, reb: 3, ast: 2, pf: 1, to: 0, stl: 0, blk: 0, pm: 11, eff: 4 },
  'Valeriane Ayayi': { jersey: 11, min: '29:52', pts: 16, fgm: 4, fga: 9, p2m: 2, p2a: 6, p3m: 2, p3a: 3, ftm: 6, fta: 7, oreb: 2, dreb: 5, reb: 7, ast: 6, pf: 1, to: 2, stl: 1, blk: 0, pm: 17, eff: 22 },
  'Janelle Salaun': { jersey: 13, dnp: true },
  'Gabby Williams': { jersey: 15, dnp: true },
  'Marieme Badiane': { jersey: 22, min: '18:42', pts: 7, fgm: 2, fga: 2, p2m: 1, p2a: 1, p3m: 1, p3a: 1, ftm: 2, fta: 2, oreb: 2, dreb: 0, reb: 2, ast: 2, pf: 3, to: 5, stl: 1, blk: 1, pm: 15, eff: 8 },
  'Marine Johannes': { jersey: 23, min: '28:38', pts: 24, fgm: 8, fga: 15, p2m: 2, p2a: 4, p3m: 6, p3a: 11, ftm: 2, fta: 2, oreb: 0, dreb: 7, reb: 7, ast: 5, pf: 1, to: 2, stl: 2, blk: 0, pm: 31, eff: 29 },
  'Migna Toure': { jersey: 28, min: '28:12', pts: 8, fgm: 3, fga: 5, p2m: 2, p2a: 3, p3m: 1, p3a: 2, ftm: 1, fta: 2, oreb: 3, dreb: 1, reb: 4, ast: 0, pf: 1, to: 1, stl: 2, blk: 0, pm: 20, eff: 10 },
  'Aminata Gueye': { jersey: 31, min: '14:49', pts: 10, fgm: 5, fga: 9, p2m: 5, p2a: 9, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 1, dreb: 3, reb: 4, ast: 1, pf: 1, to: 0, stl: 0, blk: 0, pm: 11, eff: 11 },
  'Leila Lacan': { jersey: 42, min: '25:45', pts: 11, fgm: 4, fga: 9, p2m: 3, p2a: 5, p3m: 1, p3a: 4, ftm: 2, fta: 2, oreb: 1, dreb: 3, reb: 4, ast: 3, pf: 2, to: 4, stl: 1, blk: 0, pm: 13, eff: 10 },
  'Romane Bernies': { jersey: 47, min: '18:46', pts: 5, fgm: 2, fga: 6, p2m: 1, p2a: 4, p3m: 1, p3a: 2, ftm: 0, fta: 0, oreb: 0, dreb: 2, reb: 2, ast: 4, pf: 3, to: 1, stl: 2, blk: 0, pm: 12, eff: 8 },
  'Pauline Astier': { jersey: 98, min: '18:39', pts: 6, fgm: 3, fga: 5, p2m: 3, p2a: 5, p3m: 0, p3a: 0, ftm: 0, fta: 0, oreb: 1, dreb: 0, reb: 1, ast: 3, pf: 2, to: 4, stl: 0, blk: 0, pm: 5, eff: 4 },
};

const FRANCE_TEAM_EXTRA = {
  competition: 'FIBA Women\'s Basketball World Cup 2026 Qualifying Tournament (Villeurbanne, France)',
  group: 'A',
  coaching_staff: [
    { name: '장 에메 투판 Jean Aimé Toupane', role: '감독', since: '2021-10' },
    { name: '다비드 고티에 David Gautier', role: '코치' },
    { name: '그레고리 할린 Gregory Halin', role: '코치' },
    { name: '크리스토프 레오나르 Christophe Leonard', role: '코치' },
  ],
  schedule: [
    { date: '2026-03-12', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 115, score_against: 66, opponent_code: 'PHI', opponent_name: '필리핀' },
    { date: '2026-03-13', home: false, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 88, score_against: 48, opponent_code: 'COL', opponent_name: '콜롬비아' },
    { date: '2026-03-15', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 85, score_against: 63, opponent_code: 'GER', opponent_name: '독일' },
    { date: '2026-03-16', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 93, score_against: 86, opponent_code: 'NGR', opponent_name: '나이지리아', note: '벤치 멤버들이 4쿼터 중반 2점차까지 추격 허용하며 고전' },
    { date: '2026-03-18', home: false, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 89, score_against: 62, opponent_code: 'KOR', opponent_name: '대한민국', best_performer: '마린 조아네스 24득점 5리바 5어시 (+31)' },
  ],
  group_standings: [
    { code: 'FRA', rank: 1, wins: 5, losses: 0, name_ko: '프랑스' },
    { code: 'GER', rank: 2, wins: 4, losses: 1, name_ko: '독일' },
    { code: 'KOR', rank: 3, wins: 3, losses: 2, name_ko: '대한민국' },
    { code: 'NGR', rank: 4, wins: 2, losses: 3, name_ko: '나이지리아' },
    { code: 'PHI', rank: 5, wins: 1, losses: 4, name_ko: '필리핀' },
    { code: 'COL', rank: 6, wins: 0, losses: 5, name_ko: '콜롬비아' },
  ],
  memo:
    '세계랭킹 3위. 감독 장 에메 투판(1958년생, 2021년 10월 부임).\n' +
    '2024 파리올림픽 홈에서 은메달. 2025 유로바스켓은 4위(준결승 스페인전 64-65패, 3-4위전 이탈리아전 54-69패)로 노메달에 그쳤으나, 당시 결장했던 조아네스·윌리엄스 등 주전들이 이번 대회 합류.\n' +
    '평균 신장 184cm(184cm 이상 6명). 주요 멤버 일리아나 뤼페어(#12, 2013년 심장마비로 별세한 아버지이자 프랑스 대표팀 주장·유로리그 레전드 티에리 뤼페어의 번호를 물려받음)는 부상으로 대회 직전 엔트리 아웃, 알렉시아 셰리가 대체 발탁.\n' +
    '이번 대회 팀 성적: 95.3득점/41.0리바(공격 12.0)/26.8어시/8.8스틸/2.5블록, FG 53.5%(2P 61.3%, 3P 41.6%), FT 79.3%.\n' +
    '조별리그 5전 전승(조 1위)으로 본선 진출: 필리핀 115-66, 콜롬비아 88-48, 독일 85-63, 나이지리아 93-86(벤치 위주 로테이션에 4쿼터 중반까지 추격당함), 한국 89-62.\n' +
    '주장 발레리안 아야이(#11) 인터뷰: "유로바스켓의 실망감을 뒤로하고 홈 팬들 앞에서 진정한 프랑스의 위력을 보여주고 싶었다. 라캉 같은 어린 선수들이 WNBA 무대에서 얻은 자신감을 대표팀에 불어넣고 있으며, 이것이 우리가 무패 행진을 이어가는 원동력이다."\n' +
    '2026 월드컵 본선(9/4~13, 독일 베를린) B조에서 대한민국과 재회(9/5 현지 20:45, 한국시간 9/6 03:45).',
};

const FRANCE_PLAYERS = [
  { jersey_number: 6, name: '알렉시아 셰리 Alexia Chery', position: '포워드',
    bio: { height_cm: 190, birthdate: '1998-09-05', club: "Villeneuve d'Ascq (FRA)",
      memo: '야투율 60.9%, 속공 가담과 받아먹는 득점에 최적화된 포워드. 부상당한 일리아나 뤼페어의 빈 자리에 발탁.' },
    stats: { MIN: 15, PTS: 8.0, REB: 2.5, AST: 0.5 } },
  { jersey_number: 11, name: '발레리안 아야이 Valériane Ayayi', position: '스몰포워드',
    bio: { height_cm: 184, birthdate: '1994-04-29', club: "15' SA Stars(WNBA 16경기) / USK Praha(CZE)",
      memo: '대표팀 주장. 베테랑 WNBA 경력자, 자유투 성공률 90%의 높은 집중력. 코트마진 +21로 예선 팀 최고.' },
    stats: { MIN: 21, PTS: 9.3, REB: 3.8, AST: 2.0, FT_PCT: 90 } },
  { jersey_number: 13, name: '자넬 살롱 Janelle Salaun', position: '포워드',
    bio: { height_cm: 188, birthdate: '2001-09-05', club: 'GS 발키리스(WNBA, 25~) / USK Praha(CZE)',
      memo: '팀 내 예선 득점 1위(3경기 기준). 2025 WNBA 올루키. 2점슛 성공률 100%의 무결점 화력. 나이지리아전은 휴식 차원 결장, 한국전도 결장.' },
    stats: { GP: 3, MIN: 25, PTS: 16.7, REB: 6.3, AST: 0.3, FG_PCT: 79.2, FG3_PCT: 61.5, FG3M: 2.7 } },
  { jersey_number: 14, name: '도미니크 말롱가 Dominique Malonga', position: '센터',
    bio: { height_cm: 198, birthdate: '2005-11-16', club: '시애틀 스톰(WNBA 2순위) / Fenerbahce(TUR)',
      memo: '인게임 덩커, 압도적 높이로 예선 EFF 19.5. 콜롬비아전에서 뇌진탕을 당해 이후 결장(한국전도 결장).' },
    stats: { GP: 2, MIN: 19, PTS: 14.5, REB: 6.0, AST: 1.0 } },
  { jersey_number: 15, name: '가비 윌리엄스 Gabby Williams', position: '포워드',
    bio: { height_cm: 180, birthdate: '1996-09-09', club: '시카고 스카이(18~)/시애틀 스톰(22~) / Fenerbahce(TUR)',
      memo: 'WNBA 올스타, DPOY 3위, All-Defensive 1팀 출신 세계 최정상급 수비수. 예선 EFF 16.8. 한국전은 결장.' },
    stats: { MIN: 17, PTS: 10.5, REB: 2.0, AST: 2.8, STL: 1.0, BLK: 0.8, FG3_PCT: 40, FG3M: 1.5 } },
  { jersey_number: 22, name: '마리엠 바디안 Marième Badiane', position: '센터',
    bio: { height_cm: 190, birthdate: '1994-11-24', club: '(전) 미네소타 링스(WNBA) / Schio(ITA)',
      memo: '리바운드 사수와 어시스트 능력을 겸비한 전천후 블루워커 센터.' },
    stats: { MIN: 19, PTS: 8.3, REB: 4.8, AST: 2.5 } },
  { jersey_number: 23, name: '마린 조아네스 Marine Johannes', position: '슈팅가드',
    bio: { height_cm: 177, birthdate: '1995-01-21', club: '뉴욕 리버티(19~) / Galatasaray(TUR)',
      memo: '2023 WNBA 식스맨상 4위. 예선에서는 조력자 역할(AS 4.5)에 집중했으나, 한국전에서는 24득점 5리바 5어시 +31로 팀 최고 활약(TCL 이 경기 MVP급).' },
    stats: { MIN: 19, PTS: 6.3, REB: 3.3, AST: 4.5, FG3_PCT: 35.3, FG3M: 1.5 } },
  { jersey_number: 28, name: '미냐 투레 Migna Touré', position: '슈팅가드',
    bio: { height_cm: 180, birthdate: '1994-12-19', club: '코네티컷 선(WNBA, 25~) / Besiktas(TUR)',
      memo: '2025 WNBA 합류. 야투율 55.2%의 고감도 슈터.' },
    stats: { MIN: 19, PTS: 11.5, REB: 3.5, AST: 1.8, FG3_PCT: 53.3, FG3M: 2.0 } },
  { jersey_number: 31, name: '아미나타 게예 Aminata Gueye', position: '센터',
    bio: { height_cm: 194, birthdate: '2002-07-10', club: 'Casademont Zaragoza (SPA)',
      memo: '이번 대회가 첫 성인 대표팀 승선. 194cm 신장 기반의 림 보호, 세컨드 찬스 득점 창출에 능함.' },
    stats: { MIN: 11, PTS: 5.5, REB: 3.5, AST: 0.3, OREB: 1.5 } },
  { jersey_number: 42, name: '레일라 라캉 Leïla Lacan', position: '가드',
    bio: { height_cm: 181, birthdate: '2004-06-02', club: '코네티컷 선(WNBA 24 1R10) / Basket Landes(FRA)',
      memo: '팀 내 예선 어시스트 1위. 2025 WNBA 올루키. 매 경기 스틸 2.2개로 앞선 압박 주도.' },
    stats: { MIN: 20, PTS: 10.8, REB: 1.8, AST: 5.0 } },
  { jersey_number: 47, name: '로만 베르니에스 Romane Bernies', position: '포인트가드',
    bio: { height_cm: 170, birthdate: '1993-06-27', club: 'BLMA (FRA)',
      memo: '대표팀 최고참 가드. 안정적인 볼 운반과 노련한 경기 템포 조절.' },
    stats: { MIN: 16, PTS: 4.0, REB: 1.8, AST: 3.0 } },
  { jersey_number: 98, name: '폴린 아스티에 Pauline Astier', position: '가드',
    bio: { height_cm: 181, birthdate: '2002-02-15', club: 'ZVVZ USK Praha (CZE)',
      memo: '득점 지원은 낮으나 리바운드 가담과 수비 로테이션 이해도가 높음.' },
    stats: { MIN: 13, PTS: 1.5, REB: 2.8, AST: 3.8 } },
];

const NIGERIA_TEAM_EXTRA = {
  competition: 'FIBA Women\'s Basketball World Cup 2026 Qualifying Tournament (Villeurbanne, France)',
  group: 'A',
  coaching_staff: [
    { name: '레나 와카마 Rena Wakama', role: '감독', since: '2023' },
  ],
  schedule: [
    { date: '2026-03-11', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 70, score_against: 37, opponent_code: 'COL', opponent_name: '콜롬비아', note: '2~3쿼터 16-0 런으로 승부 마감. 페인트존 38-14, 벤치 득점 39점(55%)' },
    { date: '2026-03-12', home: false, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'L', status: 'finished', score_for: 60, score_against: 77, opponent_code: 'KOR', opponent_name: '대한민국' },
    { date: '2026-03-14', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'W', status: 'finished', score_for: 101, score_against: 84, opponent_code: 'PHI', opponent_name: '필리핀' },
    { date: '2026-03-16', home: false, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'L', status: 'finished', score_for: 86, score_against: 93, opponent_code: 'FRA', opponent_name: '프랑스' },
    { date: '2026-03-18', home: true, round: '조별리그', venue: 'Lyon-Villeurbanne, France (LDLC Arena)', result: 'L', status: 'finished', score_for: 73, score_against: 81, opponent_code: 'GER', opponent_name: '독일' },
  ],
  group_standings: [
    { code: 'FRA', rank: 1, wins: 5, losses: 0, name_ko: '프랑스' },
    { code: 'GER', rank: 2, wins: 4, losses: 1, name_ko: '독일' },
    { code: 'KOR', rank: 3, wins: 3, losses: 2, name_ko: '대한민국' },
    { code: 'NGR', rank: 4, wins: 2, losses: 3, name_ko: '나이지리아' },
    { code: 'PHI', rank: 5, wins: 1, losses: 4, name_ko: '필리핀' },
    { code: 'COL', rank: 6, wins: 0, losses: 5, name_ko: '콜롬비아' },
  ],
  memo:
    '아프로바스켓 5연패(2017~2025) 지배자. 2024 파리올림픽 8강(아프리카 남녀 농구 사상 최초).\n' +
    '감독 레나 와카마(1992년생, 나이지리아계 미국인, W.Carolina 선수 출신, 2023년 부임) — 2024 올림픽 최우수 감독상, 아프로바스켓 우승 최초 여성 감독. 미국 NCAA 유학생 다수 기반의 피지컬+질식 수비("와카마 볼")가 팀 컬러.\n' +
    '2022년 최종예선에서도 프랑스를 상대로 31-11로 뒤지던 경기를 67-65 역전승으로 뒤집은 전례(22점 차 극복).\n' +
    '콜롬비아전(1차전) 70-37 대승 — 2~3쿼터 16-0 런, 페인트존 득점 38-14, 실책유발득점 17점, 속공 18점, 벤치 득점 39점(전체 55%). 3점 15%(3/20)·FT 65.2%는 약점.\n' +
    '조별리그 최종 2승3패(조 4위)로 마감: 콜롬비아 70-37, 한국전 60-77 패, 필리핀 101-84, 프랑스전 86-93 패, 독일전 73-81 패.\n' +
    '2026 월드컵 본선(9/4~13, 독일 베를린) B조에서 대한민국과 재회 — 조별리그 첫 경기(9/4 현지 14:15, 한국시간 21:30).',
};

const NIGERIA_PLAYERS = [
  { jersey_number: 0, name: '에이미 오콘코 Amy Okonkwo', position: '포워드',
    bio: { height_cm: 188, birthdate: '1996-08-26', club: '베식타스 (튀르키예)',
      memo: '2023 아프로바스켓 MVP. 내외곽 겸비 에이스, 3점 38%·FT 88%의 정교한 슈터. 수비 시 파울 관리는 미숙(경기당 3.2개).' },
    stats: { PTS: 17.8, REB: 6.5, AST: 1.8 } },
  { jersey_number: 3, name: '팔라스 쿠나이이 Pallas Kunaiyi-Akpanah', position: '센터',
    bio: { height_cm: 188, birthdate: '1997-07-12', club: '마뇰리아 (이탈리아)',
      memo: '보드 장악력 우수, 수비 리바운드 핵심(리그 리바운드 TOP3). 자유투 성공률 52%로 고의 파울 타겟이 되기도.' },
    stats: { PTS: 9.2, REB: 11.5, AST: 1.2, FT_PCT: 52 } },
  { jersey_number: 4, name: '엘리자베스 발로군 Elizabeth Balogun', position: '가드',
    bio: { height_cm: 185, birthdate: '2000-09-09', club: '랑데르노 (프랑스)',
      memo: '공수 밸런스 탁월, 코트 마진 +29로 예선 최상위. 가드진 최고 수준의 블록(1.5개). 최근 경기 야투 기복 심함(28%).' },
    stats: { PTS: 10.5, REB: 5.2, AST: 2.1, BLK: 1.5 } },
  { jersey_number: 7, name: '사라 오고케 Sarah Ogoke', position: '가드',
    bio: { height_cm: 177, birthdate: '1990-06-25', club: '페로비아리오 (모잠비크)',
      memo: '대표팀 최고참 베테랑 가드 백업.' },
    stats: {} },
  { jersey_number: 9, name: '이푸나냐 오코로 Ifunanya Okoro', position: '가드',
    bio: { height_cm: 183, birthdate: '1999-07-06', club: '스포르팅 (레바논)',
      memo: '팀 내 최다 시간 출전 주득점원. 경기당 스틸 2.3개로 리그 최상위. 3점 성공률 24%로 외곽은 취약.' },
    stats: { PTS: 11.2, REB: 4.5, AST: 2.8 } },
  { jersey_number: 10, name: '프로미스 아무카마라 Promise Amukamara', position: '포인트가드',
    bio: { height_cm: 175, birthdate: '1993-06-22', club: 'REG Women (르완다)',
      memo: '안정적인 볼 운반의 메인 야전사령관. 운동 집안 출신(오빠는 슈퍼볼 우승자, 어머니는 나이지리아 국가대표 스프린터).' },
    stats: {} },
  { jersey_number: 20, name: '무르자나투 무사 Murjanatu Musa', position: '포워드',
    bio: { height_cm: 187, birthdate: '2000-05-05', club: '바스켓 랑드 (프랑스)',
      memo: '공격 리바운드 강점, 높은 에너지 레벨.' },
    stats: {} },
  { jersey_number: 22, name: '블레싱 에지오포르 Blessing Ejiofor', position: '센터',
    bio: { height_cm: 195, birthdate: '1998-09-02', club: '푸젠 (중국)',
      memo: '팀 내 최고 신장, 골밑 높이 보강용 자원.' },
    stats: {} },
  { jersey_number: 23, name: '에지네 칼루 Ezinne Kalu', position: '포인트가드',
    bio: { height_cm: 173, birthdate: '1992-06-26', club: '로마(이탈리아) / 우한(중국)',
      memo: '2024 파리올림픽 2nd팀. 돌파와 킥아웃 패스, 클러치 능력이 강점. 실책 경기당 4.2개로 압박 수비에는 취약.' },
    stats: { PTS: 13.4, REB: 3.1, AST: 4.8 } },
  { jersey_number: 25, name: '빅토리아 마콜레이 Victoria Macaulay', position: '센터',
    bio: { height_cm: 193, birthdate: '1990-08-07', club: '엠락 코누트 (튀르키예)',
      memo: '야투율 83%(예선 기준)의 폭발적인 벤치 득점원. 30대 중반으로 25분 이상 소화 시 효율이 급감하는 경향.' },
    stats: { PTS: 14.2, REB: 7.8, AST: 0.9 } },
  { jersey_number: 32, name: '리타 이그보퀘 Rita Igbokwe', position: '센터',
    bio: { height_cm: 193, birthdate: '2001-01-28', club: '로슈 방데 (프랑스)',
      memo: '젊은 센터, 수비 지배력 및 블록슛 특화.' },
    stats: {} },
  { jersey_number: 33, name: '니콜 에나보시 Nicole Enabosi', position: '포워드',
    bio: { height_cm: 183, birthdate: '1997-03-26', club: '샤르트르 (프랑스)',
      memo: '1차전(vs 콜롬비아) 더블더블 기록. 컨트롤 타워형 포워드로 포워드 포지션 내 어시스트 1위. 외곽슛 사거리가 짧아 페인트존 의존도가 높음.' },
    stats: { PTS: 15.2, REB: 9.4, AST: 3.5 } },
];

async function upsertTeam(name, extra) {
  const existing = await get(`/rest/v1/teams?sport_id=eq.${SPORT_ID}&name=eq.${encodeURIComponent(name)}&select=id`);
  if (existing.length > 0) {
    await patch(`/rest/v1/teams?id=eq.${existing[0].id}`, { extra });
    return existing[0].id;
  }
  const [team] = await post('/rest/v1/teams', { sport_id: SPORT_ID, name, short_name: name.split(' ')[0], extra });
  return team.id;
}

async function upsertPlayers(teamId, players) {
  const existingPlayers = await get(`/rest/v1/players?team_id=eq.${teamId}&select=id,jersey_number`);
  const ids = {};
  for (const p of players) {
    const match = existingPlayers.find((x) => x.jersey_number === p.jersey_number);
    const payload = { sport_id: SPORT_ID, team_id: teamId, name: p.name, position: p.position, jersey_number: p.jersey_number, bio: p.bio, stats: p.stats };
    if (match) {
      await patch(`/rest/v1/players?id=eq.${match.id}`, payload);
      ids[p.jersey_number] = match.id;
    } else {
      const [created] = await post('/rest/v1/players', payload);
      ids[p.jersey_number] = created.id;
    }
    console.log('  player upserted', p.name);
  }
  return ids;
}

async function main() {
  console.log('== France ==');
  const franceId = await upsertTeam('프랑스 여자농구 국가대표팀', FRANCE_TEAM_EXTRA);
  const franceIdsByJersey = await upsertPlayers(franceId, FRANCE_PLAYERS);

  console.log('== Nigeria ==');
  const nigeriaId = await upsertTeam('나이지리아 여자농구 국가대표팀', NIGERIA_TEAM_EXTRA);
  const nigeriaIdsByJersey = await upsertPlayers(nigeriaId, NIGERIA_PLAYERS);

  console.log('== GAME_LOG: Korea players (vs NGR, vs FRA) ==');
  for (const [name, id] of Object.entries(KOR_IDS)) {
    const [p] = await get(`/rest/v1/players?id=eq.${id}&select=stats`);
    const log = (p.stats.GAME_LOG) || [];
    const ngrRow = KOR_VS_NGR[name];
    const fraRow = KOR_VS_FRA[name];
    const ngrEntry = ngrRow ? gameLogEntry('NGR', '2026-03-12', '조별리그', ngrRow) : null;
    const fraEntry = fraRow ? gameLogEntry('FRA', '2026-03-18', '조별리그', fraRow) : null;
    const newLog = [...log, ngrEntry, fraEntry].filter(Boolean);
    await patch(`/rest/v1/players?id=eq.${id}`, { stats: { ...p.stats, GAME_LOG: newLog } });
    console.log('  updated GAME_LOG for', name, newLog.length);
  }

  console.log('== GAME_LOG: Nigeria players (vs KOR) ==');
  for (const [enName, row] of Object.entries(NGR_VS_KOR)) {
    const id = nigeriaIdsByJersey[row.jersey];
    if (!id) { console.log('  SKIP (no id)', enName); continue; }
    const [p] = await get(`/rest/v1/players?id=eq.${id}&select=stats`);
    const entry = gameLogEntry('KOR', '2026-03-12', '조별리그', row);
    const newLog = [...(p.stats.GAME_LOG || []), entry].filter(Boolean);
    await patch(`/rest/v1/players?id=eq.${id}`, { stats: { ...p.stats, GAME_LOG: newLog } });
    console.log('  updated GAME_LOG for', enName);
  }

  console.log('== GAME_LOG: France players (vs KOR) ==');
  for (const [enName, row] of Object.entries(FRA_VS_KOR)) {
    const id = franceIdsByJersey[row.jersey];
    if (!id) { console.log('  SKIP (no id)', enName); continue; }
    const [p] = await get(`/rest/v1/players?id=eq.${id}&select=stats`);
    const entry = gameLogEntry('KOR', '2026-03-18', '조별리그', row);
    const newLog = [...(p.stats.GAME_LOG || []), entry].filter(Boolean);
    await patch(`/rest/v1/players?id=eq.${id}`, { stats: { ...p.stats, GAME_LOG: newLog } });
    console.log('  updated GAME_LOG for', enName);
  }

  console.log('done. france_team_id =', franceId, 'nigeria_team_id =', nigeriaId);
}

main().catch((e) => { console.error(e); process.exit(1); });
