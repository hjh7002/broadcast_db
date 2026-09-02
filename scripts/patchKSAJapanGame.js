// Saudi Arabia's Round 2 opener: KSA 78 - 106 Japan (2026-08-28), from FIBA's
// official box score. Adds GAME_LOG (rd: "2라운드") for players who played,
// marks the schedule entries on both KSA and JPN finished, and updates
// group_standings (win=2pts/loss=1pt).
// Usage: node scripts/patchKSAJapanGame.js
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

const DATE = '2026-08-28';
const RD = '2라운드';
const KSA_ID = 'ad84ff6f-4ff6-45c8-a7cf-ea717e7bd86a';
const KOREA_ID = 'd0232f50-b48b-4e82-9602-9d740c6ad4ce';

function row(opp, mmss, PTS, p2, p3, ft, OREB, DREB, AST, PF, TO, STL, BLK, PM, EFF) {
  const [m, s] = mmss.split(':').map(Number);
  const MIN = Math.round(m + s / 60);
  const FGM = p2[0] + p3[0], FGA = p2[1] + p3[1];
  const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : null);
  return {
    opp, date: DATE, rd: RD, MIN,
    PTS, FGM, FGA, FGP: pct(FGM, FGA),
    P2M: p2[0], P2A: p2[1], P2P: pct(p2[0], p2[1]),
    P3M: p3[0], P3A: p3[1], P3P: pct(p3[0], p3[1]),
    FTM: ft[0], FTA: ft[1], FTP: pct(ft[0], ft[1]),
    OREB, DREB, REB: OREB + DREB, AST, PF, TO, STL, BLK, PM, EFF,
  };
}

const KSA_ROWS = {
  '마르주크 알무왈라드': row('JPN', '7:40', 4, [2, 3], [0, 2], [0, 0], 0, 0, 0, 0, 0, 0, 0, -23, 1),
  '오사마 알바르가위': row('JPN', '8:25', 4, [2, 3], [0, 1], [0, 0], 0, 2, 2, 0, 0, 0, 0, -5, 4),
  '무함마드알리 압두르라흐크만': row('JPN', '36:15', 16, [4, 7], [2, 9], [2, 3], 0, 1, 2, 2, 1, 0, 0, -16, 7),
  '마스나 알마르와니': row('JPN', '30:32', 7, [2, 3], [1, 4], [0, 1], 0, 4, 6, 5, 2, 0, 0, -15, 10),
  '모하메드 알사게르': row('JPN', '4:10', 0, [0, 0], [0, 1], [0, 0], 0, 0, 0, 0, 0, 1, 0, -13, -2),
  '칼리드 압델 가바르': row('JPN', '33:30', 11, [4, 6], [0, 3], [3, 3], 1, 3, 3, 1, 0, 3, 0, -7, 10),
  '모하메드 알수와일렘': row('JPN', '35:59', 19, [6, 8], [1, 2], [4, 4], 4, 12, 7, 3, 0, 5, 0, -17, 34),
  '알리 슈바일리': row('JPN', '31:53', 17, [5, 6], [2, 4], [1, 1], 1, 3, 1, 2, 0, 2, 0, -14, 17),
  '타메르 마흐무드 모하메드': row('JPN', '9:49', 0, [0, 0], [0, 0], [0, 0], 0, 0, 0, 1, 0, 1, 0, -23, -1),
  '함맘 압둘카림 후세인': row('JPN', '1:48', 0, [0, 0], [0, 0], [0, 0], 0, 0, 0, 0, 0, 0, 0, -7, 0),
};

async function patchPlayers() {
  const players = await get(`/rest/v1/players?team_id=eq.${KSA_ID}&select=id,name,stats`);
  for (const [name, entry] of Object.entries(KSA_ROWS)) {
    const p = players.find((x) => x.name.startsWith(name));
    if (!p) { console.log('SKIP (not found):', name); continue; }
    const log = (p.stats && p.stats.GAME_LOG) || [];
    if (log.some((g) => g.date === DATE)) { console.log('already has this game:', name); continue; }
    await patch(`/rest/v1/players?id=eq.${p.id}`, { stats: { ...p.stats, GAME_LOG: [...log, entry] } });
    console.log('patched', name);
  }
}

async function patchSchedule(teamId, opponentName, scoreFor, scoreAgainst, bestPerformer) {
  const [team] = await get(`/rest/v1/teams?id=eq.${teamId}&select=extra`);
  const schedule = team.extra.schedule.map((g) => {
    if (g.date === DATE && g.opponent_name === opponentName) {
      return { ...g, status: 'finished', result: scoreFor > scoreAgainst ? 'W' : 'L', score_for: scoreFor, score_against: scoreAgainst, best_performer: bestPerformer };
    }
    return g;
  });
  await patch(`/rest/v1/teams?id=eq.${teamId}`, { extra: { ...team.extra, schedule } });
  console.log('schedule updated for', teamId);
}

async function patchStandings() {
  const teamIds = [KOREA_ID, KSA_ID, '2e5c9f10-816c-4bb8-bf7a-b5b4d95df61f'];
  for (const id of teamIds) {
    const [team] = await get(`/rest/v1/teams?id=eq.${id}&select=extra`);
    if (!team.extra.group_standings) continue;
    const standings = team.extra.group_standings.map((s) => {
      if (s.code === 'JPN') return { ...s, wins: 5, losses: 1, points: 5 * 2 + 1 };
      if (s.code === 'KSA') return { ...s, wins: 3, losses: 4, points: 3 * 2 + 4 };
      return s;
    });
    await patch(`/rest/v1/teams?id=eq.${id}`, { extra: { ...team.extra, group_standings: standings } });
    console.log('standings updated on', id);
  }
}

async function main() {
  await patchPlayers();
  await patchSchedule(KSA_ID, '일본', 78, 106, '모하메드 알수와일렘 19득점 16리바운드 (EFF 34)');
  await patchStandings();
}
main().catch((e) => { console.error(e); process.exit(1); });
