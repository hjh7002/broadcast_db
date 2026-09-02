// Round 2 Window 4 opener: Lebanon 93 - 74 Korea (2026-08-28), from FIBA's official
// box score. Adds GAME_LOG entries (rd: "2라운드") for every player who actually
// played and is in our DB, marks both teams' schedule entries as finished with
// score/best_performer, and updates group_standings (win=2pts/loss=1pt scoring).
// Usage: node scripts/patchRound2Game1_LBN_KOR.js
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
const KOREA_ID = 'd0232f50-b48b-4e82-9602-9d740c6ad4ce';
const LEBANON_ID = '2e5c9f10-816c-4bb8-bf7a-b5b4d95df61f';

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

const KOREA = {
  '이현중': row('LBN', '30:57', 11, [1, 4], [2, 7], [3, 3], 0, 5, 1, 2, 3, 0, 0, -6, 6),
  '변준형': row('LBN', '5:05', 0, [0, 0], [0, 0], [0, 0], 0, 0, 2, 0, 0, 0, 0, 1, 0),
  '이정현': row('LBN', '24:45', 13, [1, 2], [2, 10], [5, 5], 0, 1, 3, 2, 2, 0, 0, -9, 8),
  '유기상': row('LBN', '18:00', 4, [0, 0], [1, 6], [1, 2], 0, 1, 0, 0, 1, 1, 0, -10, -1),
  '안영준': row('LBN', '13:19', 3, [1, 2], [0, 2], [1, 2], 0, 2, 1, 1, 1, 1, 0, -16, 2),
  '이우석': row('LBN', '22:25', 8, [1, 2], [2, 5], [0, 0], 2, 6, 4, 2, 1, 1, 0, -7, 16),
  '여준석': row('LBN', '32:39', 19, [9, 12], [0, 2], [1, 4], 3, 1, 0, 1, 1, 0, 3, -12, 17),
  '문유현': row('LBN', '10:10', 2, [1, 3], [0, 1], [0, 0], 0, 1, 1, 2, 0, 1, 0, -11, 2),
  '장재석': row('LBN', '2:29', 0, [0, 0], [0, 0], [0, 0], 0, 1, 1, 1, 0, 0, 0, -1, 2),
  '이승현': row('LBN', '26:26', 8, [2, 4], [1, 2], [1, 2], 2, 0, 4, 2, 2, 2, 1, -9, 11),
  '에디 다니엘': row('LBN', '13:45', 6, [2, 4], [0, 0], [2, 3], 0, 0, 1, 2, 0, 2, 1, -15, 7),
};

const LEBANON = {
  'DJ 펀더버크': row('KOR', '29:45', 13, [6, 10], [0, 1], [1, 2], 3, 2, 3, 3, 1, 1, 0, 8, 15),
  '오마르 자말레딘': row('KOR', '28:06', 16, [3, 6], [3, 6], [1, 2], 4, 5, 1, 3, 2, 1, 0, 19, 18),
  '아미르 사우드': row('KOR', '5:29', 0, [0, 0], [0, 0], [0, 0], 0, 1, 1, 1, 0, 0, 0, 3, 2),
  '카림 제이눈': row('KOR', '13:54', 0, [0, 1], [0, 3], [0, 0], 1, 3, 0, 0, 3, 1, 0, 13, -2),
  '자드 칼릴': row('KOR', '10:21', 5, [1, 1], [1, 1], [0, 0], 0, 1, 2, 3, 0, 0, 0, 3, 8),
  '세르지오 엘다르위시': row('KOR', '21:37', 17, [3, 8], [2, 4], [5, 5], 0, 5, 3, 2, 3, 1, 0, 8, 16),
  '유세프 카얏': row('KOR', '31:17', 21, [7, 16], [0, 1], [7, 8], 3, 3, 3, 3, 1, 2, 2, 11, 22),
  '하이크 교크치안': row('KOR', '27:05', 12, [2, 2], [2, 4], [2, 2], 2, 6, 3, 3, 1, 1, 0, 11, 21),
  '알리 메즈헤르': row('KOR', '29:39', 9, [3, 3], [1, 3], [0, 0], 0, 4, 8, 1, 2, 0, 0, 16, 20),
  '제라르 하디디안': row('KOR', '2:47', 0, [0, 0], [0, 0], [0, 0], 0, 2, 0, 1, 0, 0, 0, 3, 2),
};

async function patchTeamPlayers(teamId, map) {
  const players = await get(`/rest/v1/players?team_id=eq.${teamId}&select=id,name,stats`);
  for (const [name, entry] of Object.entries(map)) {
    const p = players.find((x) => x.name === name || x.name.startsWith(name));
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
      return {
        ...g,
        status: 'finished',
        result: scoreFor > scoreAgainst ? 'W' : 'L',
        score_for: scoreFor,
        score_against: scoreAgainst,
        best_performer: bestPerformer,
      };
    }
    return g;
  });
  await patch(`/rest/v1/teams?id=eq.${teamId}`, { extra: { ...team.extra, schedule } });
  console.log('schedule updated for', teamId);
}

async function patchStandings() {
  const teamIds = [KOREA_ID, LEBANON_ID, 'ad84ff6f-4ff6-45c8-a7cf-ea717e7bd86a'];
  for (const id of teamIds) {
    const [team] = await get(`/rest/v1/teams?id=eq.${id}&select=extra`);
    if (!team.extra.group_standings) continue;
    const standings = team.extra.group_standings.map((s) => {
      if (s.code === 'LBN') return { ...s, wins: 6, losses: 1, points: 6 * 2 + 1 };
      if (s.code === 'KOR') return { ...s, wins: 3, losses: 4, points: 3 * 2 + 4 };
      return s;
    });
    await patch(`/rest/v1/teams?id=eq.${id}`, { extra: { ...team.extra, group_standings: standings } });
    console.log('standings updated on', id);
  }
}

async function main() {
  await patchTeamPlayers(KOREA_ID, KOREA);
  await patchTeamPlayers(LEBANON_ID, LEBANON);
  await patchSchedule(KOREA_ID, '레바논', 74, 93, '여준석 19득점 4리바운드 (EFF 17)');
  await patchSchedule(LEBANON_ID, '한국', 93, 74, '유세프 카얏 21득점 (EFF 22)');
  await patchStandings();
}
main().catch((e) => { console.error(e); process.exit(1); });
