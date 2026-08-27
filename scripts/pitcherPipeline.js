// Fetches one pitcher's full profile from the MLB Stats API / Baseball Savant and returns
// the { bio, stats } shape stored on a `players` row.
//
// Pass `{ light: true }` to skip the slow, rarely-changing parts (draft/FA info, debut
// summary, team history, awards + season-by-season title-finish search, and the
// career-wide single-game-highs loop) — used by the daily stats refresh so it stays cheap.
// Full mode (the default) computes everything, including those, and is meant for an
// occasional/weekly refresh or a one-time backfill.
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

const TEAM_KO = {
  108: '엘에이 에인절스', 109: '애리조나 다이아몬드백스', 110: '볼티모어 오리올스', 111: '보스턴 레드삭스',
  112: '시카고 컵스', 113: '신시내티 레즈', 114: '클리블랜드 가디언스', 115: '콜로라도 로키스',
  116: '디트로이트 타이거스', 117: '휴스턴 애스트로스', 118: '캔자스시티 로열스', 119: 'LA 다저스',
  120: '워싱턴 내셔널스', 121: '뉴욕 메츠', 133: '애슬레틱스', 134: '피츠버그 파이리츠',
  135: '샌디에이고 파드리스', 136: '시애틀 매리너스', 137: '샌프란시스코 자이언츠', 138: '세인트루이스 카디널스',
  139: '탬파베이 레이스', 140: '텍사스 레인저스', 141: '토론토 블루제이스', 142: '미네소타 트윈스',
  143: '필라델피아 필리스', 144: '애틀랜타 브레이브스', 145: '시카고 화이트삭스', 146: '마이애미 말린스',
  147: '뉴욕 양키스', 158: '밀워키 브루어스',
};
const TEAM_SHORT = {
  108: 'LAA', 109: 'AZ', 110: 'BAL', 111: 'BOS', 112: 'CHC', 113: 'CIN', 114: 'CLE', 115: 'COL',
  116: 'DET', 117: 'HOU', 118: 'KC', 119: 'LAD', 120: 'WSH', 121: 'NYM', 133: 'ATH', 134: 'PIT',
  135: 'SD', 136: 'SEA', 137: 'SF', 138: 'STL', 139: 'TB', 140: 'TEX', 141: 'TOR', 142: 'MIN',
  143: 'PHI', 144: 'ATL', 145: 'CWS', 146: 'MIA', 147: 'NYY', 158: 'MIL',
};
const PITCH_KO = {
  FF: '포심 패스트볼', SI: '싱커', FC: '커터', SL: '슬라이더', ST: '스위퍼', SV: '스위퍼',
  CU: '커브', KC: '너클커브', CH: '체인지업', FS: '스플리터', FO: '포크볼', KN: '너클볼',
  SC: '스크류볼', EP: '이피터',
};
const FASTBALL = new Set(['FF', 'SI', 'FC']);
const BREAKING = new Set(['SL', 'CU', 'KC', 'ST', 'SV', 'SC']);
const OFFSPEED = new Set(['CH', 'FS', 'FO', 'KN', 'EP']);

// Very simple CSV line splitter — good enough for Savant's leaderboard exports, which
// only ever quote the "Last, First" name column (the one field containing a comma).
function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === ',' && !inQuotes) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}
async function getJson(url) {
  return JSON.parse(await get(url));
}
function supaGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPA_URL + path);
    https.get(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}
function supaPatch(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const url = new URL(SUPA_URL + path);
    const req = https.request(url, {
      method: 'PATCH',
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, (res) => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve({ status: res.statusCode, d }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function ipToOuts(ip) {
  const [w, f] = String(ip || '0.0').split('.');
  return parseInt(w, 10) * 3 + (f ? parseInt(f, 10) : 0);
}
function eraFrom(er, outs) {
  return outs > 0 ? (er * 27 / outs).toFixed(2) : '-.--';
}
function avgFrom(hits, ab) {
  return ab > 0 ? (hits / ab).toFixed(3).replace(/^0/, '') : '.000';
}
function outsToIp(outs) {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

async function fetchSplits(personId, teamIds, sitCodes) {
  const d = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=statSplits&group=pitching&sitCodes=${sitCodes}&season=2026`);
  const splits = (d.stats[0] && d.stats[0].splits) || [];
  return splits.filter((s) => s.team && teamIds.includes(s.team.id));
}
function aggregateEraByCode(splits) {
  const byCode = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { er: 0, outs: 0, desc: s.split.description };
    byCode[code].er += s.stat.earnedRuns || 0;
    byCode[code].outs += ipToOuts(s.stat.inningsPitched || '0.0');
  }
  return Object.entries(byCode).map(([code, v]) => ({ code, desc: v.desc, era: eraFrom(v.er, v.outs) }));
}
function aggregateWLEraByCode(splits) {
  const byCode = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { er: 0, outs: 0, games: 0, wins: 0, losses: 0, desc: s.split.description };
    byCode[code].er += s.stat.earnedRuns || 0;
    byCode[code].outs += ipToOuts(s.stat.inningsPitched || '0.0');
    byCode[code].games += s.stat.gamesPitched || 0;
    byCode[code].wins += s.stat.wins || 0;
    byCode[code].losses += s.stat.losses || 0;
  }
  return Object.entries(byCode).map(([code, v]) => ({
    code, desc: v.desc, games: v.games, wins: v.wins, losses: v.losses, era: eraFrom(v.er, v.outs),
  }));
}
function aggregateHandByCode(splits) {
  const byCode = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { hits: 0, ab: 0, hr: 0, so: 0, desc: s.split.description };
    byCode[code].hits += s.stat.hits || 0;
    byCode[code].ab += s.stat.atBats || 0;
    byCode[code].hr += s.stat.homeRuns || 0;
    byCode[code].so += s.stat.strikeOuts || 0;
  }
  return Object.entries(byCode).map(([code, v]) => ({ code, avg: avgFrom(v.hits, v.ab), hr: v.hr, so: v.so }));
}

async function buildPitcherData(personId, currentTeamId, opponentTeamId, opts) {
  const light = !!(opts && opts.light);
  const result = { stats: {}, bio: {} };

  // ---- bio (birth, height/weight, throws/bats, debut) — cheap, always computed ----
  const bioData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}`);
  const p = bioData.people[0];
  const heightM = /(\d+)'\s*(\d+)"/.exec(p.height || '');
  const heightCm = heightM ? Math.round((parseInt(heightM[1], 10) * 12 + parseInt(heightM[2], 10)) * 2.54) : null;
  const weightKg = p.weight ? Math.round(p.weight * 0.453592) : null;
  result.bio.birthdate = p.birthDate;
  if (heightCm && weightKg) result.bio.height_weight = `${heightCm}cm, ${weightKg}kg`;
  if (p.pitchHand && p.batSide) {
    result.bio.throws_bats = `${p.pitchHand.code === 'R' ? '우투' : '좌투'} ${p.batSide.code === 'R' ? '우타' : p.batSide.code === 'L' ? '좌타' : '양타'}`;
  }
  result.bio.roster_status = '26인 로스터';
  result.bio.mlb_person_id = personId;
  result.bio.name_en = p.fullName;
  const debutYear = p.mlbDebutDate ? parseInt(p.mlbDebutDate.split('-')[0], 10) : 2026;
  result.bio.service_years = 2026 - debutYear;
  result.bio.debut_date = p.mlbDebutDate;

  if (!light) {
    // ---- draft info (or FA signing fallback) ----
    if (p.draftYear) {
      try {
        const draftData = await getJson(`https://statsapi.mlb.com/api/v1/draft/${p.draftYear}?playerId=${personId}`);
        let found = null;
        for (const r of draftData.drafts.rounds) {
          for (const pick of r.picks) {
            if (pick.person && String(pick.person.id) === String(personId)) { found = { pick, round: r.round }; break; }
          }
          if (found) break;
        }
        if (found) {
          const yy = String(p.draftYear).slice(2);
          const teamAbbr = found.pick.team ? (TEAM_SHORT[found.pick.team.id] || found.pick.team.name) : '';
          result.bio.draft_info = `${yy}' ${teamAbbr} ${found.round}R(${found.pick.pickNumber})`;
          if (found.pick.school && found.pick.school.name) result.bio.school = found.pick.school.name;
        }
      } catch (e) { /* skip draft info if unavailable */ }
    } else {
      try {
        const txData = await getJson(`https://statsapi.mlb.com/api/v1/transactions?playerId=${personId}&startDate=2000-01-01&endDate=2026-12-31`);
        const sfaTx = (txData.transactions || [])
          .filter((t) => t.typeCode === 'SFA' && t.toTeam)
          .sort((a, b) => (a.date < b.date ? -1 : 1))[0];
        if (sfaTx) {
          const yy = sfaTx.date.slice(2, 4);
          const teamAbbr = TEAM_SHORT[sfaTx.toTeam.id] || sfaTx.toTeam.name;
          result.bio.draft_info = `${yy}' FA ${teamAbbr}`;
        }
      } catch (e) { /* skip if unavailable */ }
    }

    // ---- debut game summary ----
    if (p.mlbDebutDate) {
      try {
        const debutSeason = p.mlbDebutDate.split('-')[0];
        const glDebut = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=${debutSeason}`);
        const games = (glDebut.stats[0] && glDebut.stats[0].splits) || [];
        const debut = [...games].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
        if (debut) {
          const oppShort = TEAM_SHORT[debut.opponent.id] || debut.opponent.name;
          const decision = debut.stat.wins ? 'W' : debut.stat.losses ? 'L' : 'ND';
          const dateFmt = debut.date.replace(/-/g, '.');
          result.bio.debut_summary = `${dateFmt} ${debut.isHome ? '' : '@'}${oppShort} · ${debut.stat.inningsPitched}이닝 ${debut.stat.runs}실점 · ${decision}`;
        }
      } catch (e) { /* skip */ }
    }

    // ---- team history (MLB only) ----
    try {
      const ybyRaw = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=yearByYear&group=pitching`);
      const splits = ybyRaw.stats[0].splits || [];
      const byYear = new Map();
      for (const s of splits) {
        if (!s.team || !s.team.id) continue;
        const year = parseInt(s.season, 10);
        const short = TEAM_SHORT[s.team.id] || s.team.name;
        if (!byYear.has(year)) byYear.set(year, []);
        if (!byYear.get(year).includes(short)) byYear.get(year).push(short);
      }
      const years = [...byYear.keys()].sort((a, b) => a - b);
      const segments = [];
      for (const y of years) {
        const label = byYear.get(y).join('/');
        const last = segments[segments.length - 1];
        if (last && last.label === label) last.endYear = y;
        else segments.push({ label, startYear: y, endYear: y });
      }
      const YY2 = (y) => String(y).slice(2);
      result.bio.team_history = segments
        .map((s) => (s.startYear === s.endYear ? `${s.label}(${YY2(s.startYear)})` : `${s.label}(${YY2(s.startYear)}~${YY2(s.endYear)})`))
        .join(' - ');
    } catch (e) { /* skip */ }

    // ---- awards (includes the expensive year-by-year title-finish search) ----
    try {
      const awardsData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}?hydrate=awards`);
      const awards = (awardsData.people[0] && awardsData.people[0].awards) || [];
      const YY = (y) => String(y).slice(2);
      const bySeasonSet = (ids) => [...new Set(awards.filter((a) => ids.includes(a.id)).map((a) => parseInt(a.season, 10)))].sort((a, b) => a - b);
      const countOf = (ids) => awards.filter((a) => ids.includes(a.id)).length;
      const lines = [];
      const allStarYears = bySeasonSet(['NLAS', 'ALAS']);
      if (allStarYears.length > 0) lines.push(`올스타 (${allStarYears.map(YY).join(', ')})`);
      const wsYears = bySeasonSet(['WSCHAMP']);
      if (wsYears.length > 0) lines.push(`WS우승 (${wsYears.map(YY).join(', ')})`);
      const cyYears = bySeasonSet(['NLCY', 'ALCY']);
      if (cyYears.length > 0) lines.push(`사이영 (${cyYears.map(YY).join(', ')})`);
      const potmCount = countOf(['NLPITOM', 'ALPITOM']);
      if (potmCount > 0) lines.push(`이 달의 투수 ${potmCount}회`);
      const powCount = countOf(['NLPOW', 'ALPOW']);
      if (powCount > 0) lines.push(`이 주의 투수 ${powCount}회`);
      const ggYears = bySeasonSet(['NLGG', 'ALGG', 'MLGG']);
      if (ggYears.length > 0) lines.push(`GG (${ggYears.map(YY).join(', ')})`);
      const ssYears = bySeasonSet(['NLSS', 'ALSS']);
      if (ssYears.length > 0) lines.push(`SS (${ssYears.map(YY).join(', ')})`);
      const pgYears = bySeasonSet(['NLPG', 'ALPG']);
      if (pgYears.length > 0) lines.push(`플래티넘 글러브 (${pgYears.map(YY).join(', ')})`);

      const categories = [{ key: 'earnedRunAverage', label: 'ERA' }, { key: 'wins', label: '다승' }, { key: 'strikeouts', label: '탈삼진' }, { key: 'inningsPitched', label: '이닝' }];
      const titleFinishes = [];
      const startYear = p.mlbDebutDate ? parseInt(p.mlbDebutDate.split('-')[0], 10) : 2026;
      for (let yr = startYear; yr <= 2026; yr++) {
        for (const cat of categories) {
          let ld;
          try {
            ld = await getJson(`https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${cat.key}&season=${yr}&sportId=1&leaderGameTypes=R&limit=3&statGroup=pitching`);
          } catch (e) { continue; }
          const leaders = (ld.leagueLeaders && ld.leagueLeaders[0] && ld.leagueLeaders[0].leaders) || [];
          const found = leaders.find((l) => l.person && l.person.id === personId);
          if (found) titleFinishes.push(`${cat.label} ${found.rank}위(${YY(yr)})`);
        }
      }
      if (titleFinishes.length > 0) lines.push(`타이틀 홀더: ${titleFinishes.join(', ')}`);
      result.bio.awards = lines;
    } catch (e) { /* skip */ }
  }

  // ---- season totals (top-level stats) — always computed ----
  const seasonData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=season&group=pitching&season=2026`);
  const seasonSplits = (seasonData.stats[0] && seasonData.stats[0].splits) || [];
  if (seasonSplits.length === 0) return result; // no 2026 pitching stats at all

  const combined = seasonSplits.find((s) => !s.team) || seasonSplits[seasonSplits.length - 1];
  const teamStints = seasonSplits.filter((s) => s.team);
  const toLine = (s) => ({
    games: s.stat.gamesPitched, wins: s.stat.wins, losses: s.stat.losses, ip: s.stat.inningsPitched,
    era: s.stat.era, hr: s.stat.homeRuns, k: s.stat.strikeOuts, bb: s.stat.baseOnBalls,
    avgAgainst: s.stat.avg, whip: s.stat.whip, gidp: s.stat.groundIntoDoublePlay,
    sbAllowed: s.stat.stolenBases, csAllowed: s.stat.caughtStealing, pk: s.stat.pickoffs,
    k9: s.stat.strikeoutsPer9Inn, bb9: s.stat.walksPer9Inn, hr9: s.stat.homeRunsPer9,
  });
  Object.assign(result.stats, toLine(combined));

  // ---- FIP (season + career) — a fixed 3.10 constant is used rather than a
  // year-specific one, close enough for broadcast use without tracking league constants ----
  const FIP_CONSTANT = 3.10;
  function fipFrom(hr, bb, hbp, k, outs) {
    if (!outs) return null;
    const ip = outs / 3;
    return ((13 * hr + 3 * (bb + hbp) - 2 * k) / ip + FIP_CONSTANT).toFixed(2);
  }
  result.stats.fip = fipFrom(combined.stat.homeRuns || 0, combined.stat.baseOnBalls || 0, combined.stat.hitBatsmen || 0, combined.stat.strikeOuts || 0, combined.stat.outs || 0);

  // ---- career totals (same shape as season, via a single stats=career call) ----
  try {
    const careerData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=career&group=pitching`);
    const careerSplit = (careerData.stats[0] && careerData.stats[0].splits && careerData.stats[0].splits[0]) || null;
    if (careerSplit) {
      result.stats.career = toLine(careerSplit);
      result.stats.career.fip = fipFrom(
        careerSplit.stat.homeRuns || 0, careerSplit.stat.baseOnBalls || 0,
        careerSplit.stat.hitBatsmen || 0, careerSplit.stat.strikeOuts || 0, careerSplit.stat.outs || 0,
      );
    }
  } catch (e) { /* skip */ }

  // ---- year-by-year totals — one row per season. A season split across teams (trade)
  // collapses to the combined (team-less) row MLB includes alongside the per-team ones,
  // matching how year-by-year tables are conventionally shown (one line per year). ----
  try {
    const ybyData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=yearByYear&group=pitching`);
    const ybySplits = (ybyData.stats[0] && ybyData.stats[0].splits) || [];
    const bySeasonYear = new Map();
    for (const s of ybySplits) {
      const yr = s.season;
      if (!bySeasonYear.has(yr)) bySeasonYear.set(yr, []);
      bySeasonYear.get(yr).push(s);
    }
    const yearRows = [];
    for (const [yr, splits] of [...bySeasonYear.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const combinedRow = splits.find((s) => !s.team) || splits[splits.length - 1];
      const teamLabel = splits.length > 1 ? '2TM' : (combinedRow.team ? (TEAM_SHORT[combinedRow.team.id] || combinedRow.team.name) : '');
      yearRows.push({
        season: Number(yr), team: teamLabel, ...toLine(combinedRow),
        fip: fipFrom(combinedRow.stat.homeRuns || 0, combinedRow.stat.baseOnBalls || 0, combinedRow.stat.hitBatsmen || 0, combinedRow.stat.strikeOuts || 0, combinedRow.stat.outs || 0),
      });
    }
    if (yearRows.length > 0) result.stats.yearByYear = yearRows;
  } catch (e) { /* skip */ }

  // ---- MLB-wide top-10 rank for the Summary stats (cheap-ish: ~8 leaderboard calls) ----
  try {
    const rankCategories = [
      { key: 'avgAgainst', cat: 'avg' }, { key: 'whip', cat: 'whip' }, { key: 'gidp', cat: 'groundIntoDoublePlay' },
      { key: 'sbAllowed', cat: 'stolenBases' }, { key: 'csAllowed', cat: 'caughtStealing' }, { key: 'pk', cat: 'pickoffs' },
      { key: 'k9', cat: 'strikeoutsPer9Inn' }, { key: 'bb9', cat: 'walksPer9Inn' },
      // no MLB leaderboard category exists for HR/9 — skipped, not just "not in top 10"
    ];
    const ranks = {};
    for (const rc of rankCategories) {
      let ld;
      try {
        ld = await getJson(`https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${rc.cat}&season=2026&sportId=1&leaderGameTypes=R&limit=10&statGroup=pitching`);
      } catch (e) { continue; }
      const leaders = (ld.leagueLeaders && ld.leagueLeaders[0] && ld.leagueLeaders[0].leaders) || [];
      const found = leaders.find((l) => l.person && l.person.id === personId);
      if (found) ranks[rc.key] = found.rank;
    }
    if (Object.keys(ranks).length > 0) result.stats.summaryRanks = ranks;
  } catch (e) { /* skip */ }

  const wasTraded = teamStints.length > 1;
  if (wasTraded) {
    result.stats.teamSplits = teamStints.map((s) => ({ team: TEAM_KO[s.team.id] || s.team.name, ...toLine(s) }));
  }

  const currentTeamIds = wasTraded ? teamStints.map((s) => s.team.id) : [currentTeamId];

  // ---- home/away, gameLog for current-team, months, by-inning, vs-hand — always computed ----
  const glData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=2026`);
  const allGames2026 = (glData.stats[0] && glData.stats[0].splits) || [];
  const currentTeamGames = allGames2026.filter((g) => g.team && currentTeamIds.includes(g.team.id));

  result.stats.gameLog = currentTeamGames
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((g) => {
      const s = g.stat;
      const singles = s.hits - s.doubles - s.triples - s.homeRuns;
      const ipDec = ipToOuts(s.inningsPitched) / 3;
      const gameEra = ipDec > 0 ? (s.earnedRuns * 9 / ipDec).toFixed(2) : '0.00';
      const gameWhip = ipDec > 0 ? ((s.baseOnBalls + s.hits) / ipDec).toFixed(2) : '0.00';
      return {
        date: g.date, opponentId: g.opponent.id, opponentName: TEAM_KO[g.opponent.id] || g.opponent.name,
        opponentShort: TEAM_SHORT[g.opponent.id] || g.opponent.name, isHome: g.isHome,
        decision: s.wins ? '승' : s.losses ? '패' : '-', score: null,
        era: gameEra, ip: s.inningsPitched, er: s.earnedRuns, hits: s.hits,
        singles, doubles: s.doubles, triples: s.triples, hr: s.homeRuns,
        bb: s.baseOnBalls, so: s.strikeOuts, whip: gameWhip, hbp: s.hitByPitch,
      };
    });

  result.stats.recentGames = [...allGames2026]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)
    .map((g) => ({
      date: g.date, opponentShort: TEAM_SHORT[g.opponent.id] || g.opponent.name, isHome: g.isHome,
      ip: g.stat.inningsPitched, hits: g.stat.hits, runs: g.stat.runs, er: g.stat.earnedRuns,
      hr: g.stat.homeRuns, so: g.stat.strikeOuts, bb: g.stat.baseOnBalls,
    }));

  const haSplits = await fetchSplits(personId, currentTeamIds, 'h,a');
  const haAgg = aggregateWLEraByCode(haSplits);
  result.stats.splitsInfo = result.stats.splitsInfo || {};
  result.stats.splitsInfo.homeAway = haAgg.map((x) => ({
    label: x.code === 'h' ? '홈' : '원정', games: x.games, wins: x.wins, losses: x.losses, era: x.era,
  }));

  const monthAgg = {};
  for (const g of currentTeamGames) {
    const m = parseInt(g.date.split('-')[1], 10);
    if (!monthAgg[m]) monthAgg[m] = { er: 0, outs: 0 };
    monthAgg[m].er += g.stat.earnedRuns;
    monthAgg[m].outs += ipToOuts(g.stat.inningsPitched);
  }
  result.stats.splitsInfo.byMonth = Object.keys(monthAgg).sort((a, b) => a - b).map((m) => ({
    label: `${m}월`, era: eraFrom(monthAgg[m].er, monthAgg[m].outs),
  }));

  const vlrSplits = await fetchSplits(personId, currentTeamIds, 'vl,vr');
  const handAgg = aggregateHandByCode(vlrSplits);
  result.stats.splitsInfo.vsHand = handAgg.map((x) => ({
    label: x.code === 'vl' ? '좌타자' : '우타자', avg: x.avg, hr: x.hr, so: x.so,
  }));

  const inningSplits = await fetchSplits(personId, currentTeamIds, 'i01,i02,i03,i04,i05,i06,i07,i08,i09');
  result.stats.splitsInfo.byInning = aggregateEraByCode(inningSplits)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((x, i) => ({ label: `${i + 1}이닝`, era: x.era }));

  // Starters and relievers rest completely differently (a starter's "short rest" is a
  // reliever's every day), so the bucket scheme itself depends on the pitcher's role —
  // determined from this season's actual games-started share rather than a roster label,
  // since a swingman's role can otherwise be ambiguous.
  const gamesStartedSeason = combined.stat.gamesStarted || 0;
  const gamesPitchedSeason = combined.stat.gamesPitched || 0;
  const isStarter = gamesPitchedSeason > 0 && gamesStartedSeason / gamesPitchedSeason >= 0.5;

  const sortedAll = [...allGames2026].sort((a, b) => (a.date < b.date ? -1 : 1));
  const restAgg = {};
  for (let i = 1; i < sortedAll.length; i++) {
    const prev = new Date(sortedAll[i - 1].date);
    const cur = new Date(sortedAll[i].date);
    const restDays = Math.max(0, Math.round((cur - prev) / 86400000) - 1);
    const bucket = isStarter
      ? (restDays <= 4 ? '4' : restDays === 5 ? '5' : '5+')
      : (restDays === 0 ? '0' : restDays === 1 ? '1' : restDays === 2 ? '2' : '3+');
    if (!restAgg[bucket]) restAgg[bucket] = { er: 0, outs: 0 };
    restAgg[bucket].er += sortedAll[i].stat.earnedRuns;
    restAgg[bucket].outs += ipToOuts(sortedAll[i].stat.inningsPitched);
  }
  const restOrder = isStarter ? ['4', '5', '5+'] : ['0', '1', '2', '3+'];
  result.stats.splitsInfo.byRest = restOrder
    .filter((b) => restAgg[b])
    .map((b) => ({ label: `${b}일 휴식`, era: eraFrom(restAgg[b].er, restAgg[b].outs) }));

  // Starter-role vs reliever-role split — only meaningful (and only ever populated) for a
  // pitcher who's actually appeared both ways this season, like a swingman.
  const roleAgg = {
    선발: { games: 0, wins: 0, losses: 0, er: 0, outs: 0 },
    구원: { games: 0, wins: 0, losses: 0, er: 0, outs: 0 },
  };
  for (const g of currentTeamGames) {
    const bucket = g.stat.gamesStarted ? roleAgg.선발 : roleAgg.구원;
    bucket.games += 1;
    bucket.wins += g.stat.wins || 0;
    bucket.losses += g.stat.losses || 0;
    bucket.er += g.stat.earnedRuns || 0;
    bucket.outs += ipToOuts(g.stat.inningsPitched);
  }
  if (roleAgg.선발.games > 0 && roleAgg.구원.games > 0) {
    result.stats.splitsInfo.byRole = ['선발', '구원'].map((label) => ({
      label,
      games: roleAgg[label].games, wins: roleAgg[label].wins, losses: roleAgg[label].losses,
      era: eraFrom(roleAgg[label].er, roleAgg[label].outs),
    }));
  }

  if (p.mlbDebutDate && opponentTeamId) {
    const startYear = parseInt(p.mlbDebutDate.split('-')[0], 10);
    let careerG = 0, careerW = 0, careerL = 0, careerOuts = 0, careerEr = 0;
    let seasonG = 0, seasonW = 0, seasonL = 0, seasonOuts = 0, seasonEr = 0;
    for (let yr = startYear; yr <= 2026; yr++) {
      let logData;
      try {
        logData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=${yr}`);
      } catch (e) { continue; }
      const splits = (logData.stats[0] && logData.stats[0].splits) || [];
      for (const g of splits) {
        if (!g.opponent || g.opponent.id !== opponentTeamId) continue;
        careerG += 1; careerW += g.stat.wins || 0; careerL += g.stat.losses || 0;
        careerOuts += ipToOuts(g.stat.inningsPitched); careerEr += g.stat.earnedRuns || 0;
        if (yr === 2026) {
          seasonG += 1; seasonW += g.stat.wins || 0; seasonL += g.stat.losses || 0;
          seasonOuts += ipToOuts(g.stat.inningsPitched); seasonEr += g.stat.earnedRuns || 0;
        }
      }
    }
    result.stats.splitsInfo.vsOpponent = {
      opponent: TEAM_KO[opponentTeamId],
      career: { games: careerG, wins: careerW, losses: careerL, era: eraFrom(careerEr, careerOuts) },
      season: { games: seasonG, wins: seasonW, losses: seasonL, era: eraFrom(seasonEr, seasonOuts) },
    };
  }

  function maxOf(list, key) { return list.reduce((m, g) => ((g[key] || 0) > m ? g[key] : m), 0); }
  function maxOuts(list) { return list.reduce((m, g) => Math.max(m, ipToOuts(g.inningsPitched)), 0); }
  const seasonStatList = currentTeamGames.map((g) => g.stat);
  result.stats.singleGameHighs = {
    season: {
      ip: outsToIp(maxOuts(seasonStatList)), hits: maxOf(seasonStatList, 'hits'), runs: maxOf(seasonStatList, 'runs'),
      er: maxOf(seasonStatList, 'earnedRuns'), so: maxOf(seasonStatList, 'strikeOuts'),
      bb: maxOf(seasonStatList, 'baseOnBalls'), hr: maxOf(seasonStatList, 'homeRuns'),
    },
  };
  if (!light && p.mlbDebutDate) {
    const startYear = parseInt(p.mlbDebutDate.split('-')[0], 10);
    let careerStatList = [];
    for (let yr = startYear; yr <= 2026; yr++) {
      let logData;
      try {
        logData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=${yr}`);
      } catch (e) { continue; }
      const splits = (logData.stats[0] && logData.stats[0].splits) || [];
      careerStatList = careerStatList.concat(splits.map((g) => g.stat));
    }
    result.stats.singleGameHighs.career = {
      ip: outsToIp(maxOuts(careerStatList)), hits: maxOf(careerStatList, 'hits'), runs: maxOf(careerStatList, 'runs'),
      er: maxOf(careerStatList, 'earnedRuns'), so: maxOf(careerStatList, 'strikeOuts'),
      bb: maxOf(careerStatList, 'baseOnBalls'), hr: maxOf(careerStatList, 'homeRuns'),
    };
  }

  // pitch mix (Baseball Savant) — always computed, single request
  try {
    const html = await get(`https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=${personId}&position=1&hand=&pitchBreakdown=pitches&timeFrame=yearly&season=&pitchType=&count=&gameType=&updatePitches=true`);
    const m = html.match(/window\.serverVals\.pitchDetails\s*=\s*(\[.*?\])\s*(?:;|\n)/s);
    if (m) {
      const arr = JSON.parse(m[1]);
      const y2026 = arr.filter((x) => x.year === 2026).sort((a, b) => parseFloat(b.pitch_percent) - parseFloat(a.pitch_percent));
      result.stats.pitchMix = y2026.map((x) => ({
        type: x.api_pitch_type, typeKo: PITCH_KO[x.api_pitch_type] || x.api_pitch_type,
        usage: `${x.pitch_percent}%`, velo: `${x.release_speed} mph`, ba: x.ba,
        hr: parseInt(x.hr, 10) || 0, whiff: `${x.whiff_percent}%`,
      }));

      // pitch usage against LHB vs RHB (from the same breakdown, no extra request) —
      // normalized within each handedness's own pitch total, e.g. "40% of pitches
      // thrown to LHB were sinkers" rather than a raw thrown-count.
      const totalVsL = y2026.reduce((sum, x) => sum + (parseInt(x.lhb, 10) || 0), 0);
      const totalVsR = y2026.reduce((sum, x) => sum + (parseInt(x.rhb, 10) || 0), 0);
      if (totalVsL > 0 || totalVsR > 0) {
        result.stats.handDistribution = y2026.map((x) => ({
          type: x.api_pitch_type, typeKo: PITCH_KO[x.api_pitch_type] || x.api_pitch_type,
          vsL: totalVsL > 0 ? +(((parseInt(x.lhb, 10) || 0) / totalVsL) * 100).toFixed(1) : 0,
          vsR: totalVsR > 0 ? +(((parseInt(x.rhb, 10) || 0) / totalVsR) * 100).toFixed(1) : 0,
        }));
      }
    }
  } catch (e) { /* pitch mix unavailable */ }

  // pitch value by category (Baseball Savant's pitch-arsenal-stats run values,
  // grouped into fastball/breaking/offspeed) — always computed, single request
  try {
    const csv = await get(`https://baseballsavant.mlb.com/leaderboard/pitch-arsenal-stats?type=pitcher&pitchType=&year=2026&team=&min=1&csv=true`);
    const lines3 = csv.trim().split('\n');
    const header3 = splitCsvLine(lines3[0]);
    const idIdx = header3.indexOf('player_id');
    const typeIdx = header3.indexOf('pitch_type');
    const rvIdx = header3.indexOf('run_value');
    const buckets = { 패스트볼: 0, 브레이킹볼: 0, 오프스피드: 0 };
    let found = false;
    for (const line of lines3.slice(1)) {
      const cols = splitCsvLine(line);
      if (parseInt(cols[idIdx], 10) !== personId) continue;
      found = true;
      const type = cols[typeIdx];
      const rv = parseFloat(cols[rvIdx]) || 0;
      if (FASTBALL.has(type)) buckets.패스트볼 += rv;
      else if (BREAKING.has(type)) buckets.브레이킹볼 += rv;
      else if (OFFSPEED.has(type)) buckets.오프스피드 += rv;
    }
    if (found) result.stats.pitchValueByCategory = buckets;
  } catch (e) { /* pitch value unavailable */ }

  return result;
}

module.exports = { buildPitcherData, supaGet, supaPatch, TEAM_KO, TEAM_SHORT };
