// Fetches one batter's full profile from the MLB Stats API and returns the { bio, stats }
// shape stored on a `players` row.
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

function avgFrom(hits, ab) { return ab > 0 ? (hits / ab).toFixed(3).replace(/^0/, '') : '.000'; }
function fmt3(n) { return (n < 0 ? '-' : '') + Math.abs(n).toFixed(3).replace(/^0/, ''); }
function opsFrom(ab, hits, bb, hbp, sf, tb) {
  const obpDenom = ab + bb + hbp + sf;
  const obp = obpDenom > 0 ? (hits + bb + hbp) / obpDenom : 0;
  const slg = ab > 0 ? tb / ab : 0;
  return fmt3(obp + slg);
}

async function fetchSplits(personId, teamIds, sitCodes) {
  const d = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=statSplits&group=hitting&sitCodes=${sitCodes}&season=2026`);
  const splits = (d.stats[0] && d.stats[0].splits) || [];
  return splits.filter((s) => s.team && teamIds.includes(s.team.id));
}
function aggregateAvgByCode(splits) {
  const byCode = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { hits: 0, ab: 0, hr: 0, desc: s.split.description };
    byCode[code].hits += s.stat.hits || 0;
    byCode[code].ab += s.stat.atBats || 0;
    byCode[code].hr += s.stat.homeRuns || 0;
  }
  return Object.entries(byCode).map(([code, v]) => ({ code, desc: v.desc, avg: avgFrom(v.hits, v.ab), hr: v.hr }));
}
function aggregateGamesAvgByCode(splits) {
  const byCode = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { hits: 0, ab: 0, hr: 0, games: 0, desc: s.split.description };
    byCode[code].hits += s.stat.hits || 0;
    byCode[code].ab += s.stat.atBats || 0;
    byCode[code].hr += s.stat.homeRuns || 0;
    byCode[code].games += s.stat.gamesPlayed || 0;
  }
  return Object.entries(byCode).map(([code, v]) => ({
    code, desc: v.desc, games: v.games, avg: avgFrom(v.hits, v.ab), hr: v.hr,
  }));
}

async function buildHitterData(personId, currentTeamId, opponentTeamId, opts) {
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
    // ---- draft info (or FA signing fallback for non-drafted players) ----
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
      } catch (e) { /* skip */ }
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
      } catch (e) { /* skip */ }
    }

    // ---- debut game summary ----
    if (p.mlbDebutDate) {
      try {
        const debutSeason = p.mlbDebutDate.split('-')[0];
        const glDebut = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=hitting&season=${debutSeason}`);
        const games = (glDebut.stats[0] && glDebut.stats[0].splits) || [];
        const debut = [...games].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
        if (debut) {
          const oppShort = TEAM_SHORT[debut.opponent.id] || debut.opponent.name;
          const dateFmt = debut.date.replace(/-/g, '.');
          result.bio.debut_summary = `${dateFmt} ${debut.isHome ? '' : '@'}${oppShort} · ${debut.stat.atBats}타수 ${debut.stat.hits}안타${debut.stat.homeRuns ? ` ${debut.stat.homeRuns}홈런` : ''}`;
        }
      } catch (e) { /* skip */ }
    }

    // ---- team history (MLB only) ----
    try {
      const ybyRaw = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=yearByYear&group=hitting`);
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
      const YY = (y) => String(y).slice(2);
      result.bio.team_history = segments
        .map((s) => (s.startYear === s.endYear ? `${s.label}(${YY(s.startYear)})` : `${s.label}(${YY(s.startYear)}~${YY(s.endYear)})`))
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
      const mvpYears = bySeasonSet(['NLMVP', 'ALMVP']);
      if (mvpYears.length > 0) lines.push(`MVP (${mvpYears.map(YY).join(', ')})`);
      const pomCount = countOf(['NLPOM', 'ALPOM']);
      if (pomCount > 0) lines.push(`이 달의 선수 ${pomCount}회`);
      const powCount = countOf(['NLPOW', 'ALPOW']);
      if (powCount > 0) lines.push(`이 주의 선수 ${powCount}회`);
      const ggYears = bySeasonSet(['NLGG', 'ALGG', 'MLGG']);
      if (ggYears.length > 0) lines.push(`GG (${ggYears.map(YY).join(', ')})`);
      const ssYears = bySeasonSet(['NLSS', 'ALSS']);
      if (ssYears.length > 0) lines.push(`SS (${ssYears.map(YY).join(', ')})`);
      const pgYears = bySeasonSet(['NLPG', 'ALPG']);
      if (pgYears.length > 0) lines.push(`플래티넘 글러브 (${pgYears.map(YY).join(', ')})`);

      const categories = [{ key: 'battingAverage', label: '타율' }, { key: 'homeRuns', label: '홈런' }, { key: 'runsBattedIn', label: '타점' }];
      const titleFinishes = [];
      const startYear = p.mlbDebutDate ? parseInt(p.mlbDebutDate.split('-')[0], 10) : 2026;
      for (let yr = startYear; yr <= 2026; yr++) {
        for (const cat of categories) {
          let ld;
          try {
            ld = await getJson(`https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${cat.key}&season=${yr}&sportId=1&leaderGameTypes=R&limit=3&statGroup=hitting`);
          } catch (e) { continue; }
          const leaders = (ld.leagueLeaders && ld.leagueLeaders[0] && ld.leagueLeaders[0].leaders) || [];
          const found = leaders.find((l) => l.person && l.person.id === personId);
          if (found) titleFinishes.push(`${cat.label} ${found.rank}위(${YY(yr)})`);
        }
      }
      if (titleFinishes.length > 0) lines.push(`타이틀: ${titleFinishes.join(', ')}`);
      result.bio.awards = lines;
    } catch (e) { /* skip */ }
  }

  // ---- season totals (top-level stats) — always computed ----
  const seasonData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=season&group=hitting&season=2026`);
  const seasonSplits = (seasonData.stats[0] && seasonData.stats[0].splits) || [];
  if (seasonSplits.length === 0) return result; // no 2026 hitting stats at all

  const combined = seasonSplits.find((s) => !s.team) || seasonSplits[seasonSplits.length - 1];
  const teamStints = seasonSplits.filter((s) => s.team);
  const toLine = (s) => ({
    games: s.stat.gamesPlayed, r: s.stat.runs, doubles: s.stat.doubles, triples: s.stat.triples,
    hr: s.stat.homeRuns, rbi: s.stat.rbi, sb: s.stat.stolenBases, cs: s.stat.caughtStealing,
    bb: s.stat.baseOnBalls, hbp: s.stat.hitByPitch, avg: s.stat.avg, obp: s.stat.obp, slg: s.stat.slg, ops: s.stat.ops,
  });
  Object.assign(result.stats, toLine(combined));

  // ---- career totals (same shape as season, via a single stats=career call) ----
  try {
    const careerData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=career&group=hitting`);
    const careerSplit = (careerData.stats[0] && careerData.stats[0].splits && careerData.stats[0].splits[0]) || null;
    if (careerSplit) result.stats.career = toLine(careerSplit);
  } catch (e) { /* skip */ }

  // ---- year-by-year totals — one row per season. A season split across teams (trade)
  // collapses to the combined (team-less) row MLB includes alongside the per-team ones,
  // matching how year-by-year tables are conventionally shown (one line per year). ----
  try {
    const ybyData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=yearByYear&group=hitting`);
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
      yearRows.push({ season: Number(yr), team: teamLabel, ...toLine(combinedRow) });
    }
    if (yearRows.length > 0) result.stats.yearByYear = yearRows;
  } catch (e) { /* skip */ }

  // ---- OAA (season, via Savant's outs_above_average leaderboard, matched by MLB person id) ----
  try {
    const csv = await get(`https://baseballsavant.mlb.com/leaderboard/outs_above_average?year=2026&type=Fielder&min=1&csv=true`);
    const lines2 = csv.trim().split('\n');
    const header2 = splitCsvLine(lines2[0]);
    const idIdx = header2.indexOf('player_id');
    const oaaIdx = header2.indexOf('outs_above_average');
    for (const line of lines2.slice(1)) {
      const cols = splitCsvLine(line);
      if (parseInt(cols[idIdx], 10) === personId) { result.stats.oaa = parseInt(cols[oaaIdx], 10); break; }
    }
  } catch (e) { /* skip */ }

  // ---- errors (season + career, via the fielding stat group) ----
  try {
    const sumErrors = (splits) => splits.reduce((sum, s) => sum + (s.stat.errors || 0), 0);
    const seasonFielding = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=season&group=fielding&season=2026`);
    result.stats.errors = sumErrors((seasonFielding.stats[0] && seasonFielding.stats[0].splits) || []);
    if (!light) {
      const careerFielding = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=career&group=fielding`);
      const careerErrors = sumErrors((careerFielding.stats[0] && careerFielding.stats[0].splits) || []);
      if (result.stats.career) result.stats.career.errors = careerErrors;
    }
  } catch (e) { /* skip */ }

  // ---- MLB-wide top-10 rank for each Summary stat (except games) ----
  try {
    const rankCategories = [
      { key: 'r', cat: 'runs' }, { key: 'doubles', cat: 'doubles' }, { key: 'triples', cat: 'triples' },
      { key: 'hr', cat: 'homeRuns' }, { key: 'rbi', cat: 'rbi' }, { key: 'sb', cat: 'stolenBases' },
      { key: 'cs', cat: 'caughtStealing' }, { key: 'bb', cat: 'baseOnBalls' }, { key: 'hbp', cat: 'hitByPitch' },
      { key: 'avg', cat: 'battingAverage' }, { key: 'obp', cat: 'onBasePercentage' },
      { key: 'slg', cat: 'sluggingPercentage' }, { key: 'ops', cat: 'onBasePlusSlugging' },
    ];
    const ranks = {};
    for (const rc of rankCategories) {
      let ld;
      try {
        ld = await getJson(`https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${rc.cat}&season=2026&sportId=1&leaderGameTypes=R&limit=10&statGroup=hitting`);
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

  // ---- gameLog (current team) + recentGames (cross-team) — always computed ----
  const glData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=hitting&season=2026`);
  const allGames2026 = (glData.stats[0] && glData.stats[0].splits) || [];
  const currentTeamGames = allGames2026.filter((g) => g.team && currentTeamIds.includes(g.team.id));

  result.stats.gameLog = currentTeamGames
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((g) => {
      const s = g.stat;
      return {
        date: g.date, opponentId: g.opponent.id, opponentName: TEAM_KO[g.opponent.id] || g.opponent.name,
        opponentShort: TEAM_SHORT[g.opponent.id] || g.opponent.name, isHome: g.isHome,
        ab: s.atBats, hits: s.hits, doubles: s.doubles, triples: s.triples, hr: s.homeRuns,
        rbi: s.rbi, r: s.runs, bb: s.baseOnBalls, so: s.strikeOuts, sb: s.stolenBases, avg: avgFrom(s.hits, s.atBats),
      };
    });

  result.stats.recentGames = [...allGames2026]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)
    .map((g) => ({
      date: g.date, opponentShort: TEAM_SHORT[g.opponent.id] || g.opponent.name, isHome: g.isHome,
      ab: g.stat.atBats, hits: g.stat.hits, hr: g.stat.homeRuns, rbi: g.stat.rbi, bb: g.stat.baseOnBalls, so: g.stat.strikeOuts,
    }));

  // ---- streaks: hit streak, on-base streak, multi-hit streak — always computed ----
  const sortedDesc = [...currentTeamGames].sort((a, b) => (a.date < b.date ? 1 : -1));
  function walkStreak(pred) {
    const games = [];
    for (const g of sortedDesc) {
      const ab = g.stat.atBats || 0, bb = g.stat.baseOnBalls || 0, hbp = g.stat.hitByPitch || 0;
      if (ab === 0 && bb === 0 && hbp === 0) continue; // no real PA, skip without breaking
      if (pred(g.stat)) games.push(g); else break;
    }
    if (games.length === 0) return null;
    const t = games.reduce((acc, g) => {
      acc.ab += g.stat.atBats || 0; acc.hits += g.stat.hits || 0; acc.hr += g.stat.homeRuns || 0;
      acc.doubles += g.stat.doubles || 0; acc.bb += g.stat.baseOnBalls || 0; acc.hbp += g.stat.hitByPitch || 0;
      acc.sf += g.stat.sacFlies || 0; acc.tb += g.stat.totalBases || 0;
      return acc;
    }, { ab: 0, hits: 0, hr: 0, doubles: 0, bb: 0, hbp: 0, sf: 0, tb: 0 });
    const obpDenom = t.ab + t.bb + t.hbp + t.sf;
    const obp = obpDenom > 0 ? (t.hits + t.bb + t.hbp) / obpDenom : 0;
    const slg = t.ab > 0 ? t.tb / t.ab : 0;
    return { games: games.length, ab: t.ab, hits: t.hits, hr: t.hr, doubles: t.doubles, avg: avgFrom(t.hits, t.ab), ops: fmt3(obp + slg) };
  }
  result.stats.hitStreak = walkStreak((s) => (s.hits || 0) > 0);
  result.stats.onBaseStreak = walkStreak((s) => (s.hits || 0) > 0 || (s.baseOnBalls || 0) > 0 || (s.hitByPitch || 0) > 0);
  result.stats.multiHitStreak = walkStreak((s) => (s.hits || 0) >= 2);

  // ---- single-game highs (season = current team, career = all seasons since debut) ----
  function maxOf(list, key) { return list.reduce((m, g) => ((g[key] || 0) > m ? g[key] : m), 0); }
  const seasonStatList = currentTeamGames.map((g) => g.stat);
  result.stats.singleGameHighs = {
    season: {
      hits: maxOf(seasonStatList, 'hits'), hr: maxOf(seasonStatList, 'homeRuns'), rbi: maxOf(seasonStatList, 'rbi'),
      doubles: maxOf(seasonStatList, 'doubles'), sb: maxOf(seasonStatList, 'stolenBases'), bb: maxOf(seasonStatList, 'baseOnBalls'),
    },
  };
  if (!light && p.mlbDebutDate) {
    const startYear = parseInt(p.mlbDebutDate.split('-')[0], 10);
    let careerStatList = [];
    for (let yr = startYear; yr <= 2026; yr++) {
      let logData;
      try {
        logData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=hitting&season=${yr}`);
      } catch (e) { continue; }
      const splits = (logData.stats[0] && logData.stats[0].splits) || [];
      careerStatList = careerStatList.concat(splits.map((g) => g.stat));
    }
    result.stats.singleGameHighs.career = {
      hits: maxOf(careerStatList, 'hits'), hr: maxOf(careerStatList, 'homeRuns'), rbi: maxOf(careerStatList, 'rbi'),
      doubles: maxOf(careerStatList, 'doubles'), sb: maxOf(careerStatList, 'stolenBases'), bb: maxOf(careerStatList, 'baseOnBalls'),
    };
  }

  // ---- splits — always computed ----
  result.stats.splitsInfo = result.stats.splitsInfo || {};

  const haSplits = await fetchSplits(personId, currentTeamIds, 'h,a');
  const haAgg = aggregateGamesAvgByCode(haSplits);
  result.stats.splitsInfo.homeAway = haAgg.map((x) => ({ label: x.code === 'h' ? '홈' : '원정', games: x.games, avg: x.avg, hr: x.hr }));

  const vlrSplits = await fetchSplits(personId, currentTeamIds, 'vl,vr');
  const handAgg = aggregateAvgByCode(vlrSplits);
  result.stats.splitsInfo.vsHand = handAgg.map((x) => ({ label: x.code === 'vl' ? '좌투수' : '우투수', avg: x.avg, hr: x.hr }));

  const monthAgg = {};
  for (const g of currentTeamGames) {
    const m = parseInt(g.date.split('-')[1], 10);
    if (!monthAgg[m]) monthAgg[m] = { hits: 0, ab: 0, hr: 0, bb: 0, hbp: 0, sf: 0, tb: 0 };
    monthAgg[m].hits += g.stat.hits || 0;
    monthAgg[m].ab += g.stat.atBats || 0;
    monthAgg[m].hr += g.stat.homeRuns || 0;
    monthAgg[m].bb += g.stat.baseOnBalls || 0;
    monthAgg[m].hbp += g.stat.hitByPitch || 0;
    monthAgg[m].sf += g.stat.sacFlies || 0;
    monthAgg[m].tb += g.stat.totalBases || 0;
  }
  result.stats.splitsInfo.byMonth = Object.keys(monthAgg).sort((a, b) => a - b).map((m) => {
    const v = monthAgg[m];
    return { label: `${m}월`, avg: avgFrom(v.hits, v.ab), hr: v.hr, ops: opsFrom(v.ab, v.hits, v.bb, v.hbp, v.sf, v.tb) };
  });

  try {
    const asgData = await getJson(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&season=2026&gameType=A`);
    const asgDate = asgData.dates && asgData.dates[0] && asgData.dates[0].date;
    if (asgDate) {
      const halves = {
        전반기: { hits: 0, ab: 0, hr: 0, bb: 0, hbp: 0, sf: 0, tb: 0 },
        후반기: { hits: 0, ab: 0, hr: 0, bb: 0, hbp: 0, sf: 0, tb: 0 },
      };
      for (const g of currentTeamGames) {
        const bucket = g.date <= asgDate ? '전반기' : '후반기';
        halves[bucket].hits += g.stat.hits || 0;
        halves[bucket].ab += g.stat.atBats || 0;
        halves[bucket].hr += g.stat.homeRuns || 0;
        halves[bucket].bb += g.stat.baseOnBalls || 0;
        halves[bucket].hbp += g.stat.hitByPitch || 0;
        halves[bucket].sf += g.stat.sacFlies || 0;
        halves[bucket].tb += g.stat.totalBases || 0;
      }
      result.stats.splitsInfo.byHalf = Object.entries(halves)
        .filter(([, v]) => v.ab > 0)
        .map(([label, v]) => ({ label, avg: avgFrom(v.hits, v.ab), hr: v.hr, ops: opsFrom(v.ab, v.hits, v.bb, v.hbp, v.sf, v.tb) }));
    }
  } catch (e) { /* skip */ }

  const countSplits = await fetchSplits(personId, currentTeamIds, 'fp,fc,ac,bc,ec');
  const countAgg = aggregateAvgByCode(countSplits);
  const countLabel = { fp: '초구', fc: '풀카운트', ac: '타자 유리', bc: '투수 유리', ec: '동률' };
  result.stats.splitsInfo.byCount = countAgg.map((x) => ({ label: countLabel[x.code] || x.code, avg: x.avg }));

  const runnerSplits = await fetchSplits(personId, currentTeamIds, 'r0,ron,risp,risp2');
  const runnerAgg = aggregateAvgByCode(runnerSplits);
  const runnerLabel = { r0: '주자 없음', ron: '주자 있음', risp: '득점권', risp2: '2아웃 득점권' };
  result.stats.splitsInfo.byRunners = runnerAgg.map((x) => ({ label: runnerLabel[x.code] || x.code, avg: x.avg }));

  if (p.mlbDebutDate && opponentTeamId) {
    const startYear = parseInt(p.mlbDebutDate.split('-')[0], 10);
    let cG = 0, cAb = 0, cHits = 0, cHr = 0, cRbi = 0, cBb = 0, cHbp = 0, cSf = 0, cTb = 0;
    let sG = 0, sAb = 0, sHits = 0, sHr = 0, sRbi = 0, sBb = 0, sHbp = 0, sSf = 0, sTb = 0;
    for (let yr = startYear; yr <= 2026; yr++) {
      let logData;
      try {
        logData = await getJson(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=hitting&season=${yr}`);
      } catch (e) { continue; }
      const splits = (logData.stats[0] && logData.stats[0].splits) || [];
      for (const g of splits) {
        if (!g.opponent || g.opponent.id !== opponentTeamId) continue;
        if ((g.stat.atBats || 0) === 0 && (g.stat.baseOnBalls || 0) === 0) continue;
        cG += 1; cAb += g.stat.atBats || 0; cHits += g.stat.hits || 0; cHr += g.stat.homeRuns || 0;
        cRbi += g.stat.rbi || 0; cBb += g.stat.baseOnBalls || 0; cHbp += g.stat.hitByPitch || 0;
        cSf += g.stat.sacFlies || 0; cTb += g.stat.totalBases || 0;
        if (yr === 2026) {
          sG += 1; sAb += g.stat.atBats || 0; sHits += g.stat.hits || 0; sHr += g.stat.homeRuns || 0;
          sRbi += g.stat.rbi || 0; sBb += g.stat.baseOnBalls || 0; sHbp += g.stat.hitByPitch || 0;
          sSf += g.stat.sacFlies || 0; sTb += g.stat.totalBases || 0;
        }
      }
    }
    result.stats.splitsInfo.vsOpponent = {
      opponent: TEAM_KO[opponentTeamId],
      career: { games: cG, avg: avgFrom(cHits, cAb), ops: opsFrom(cAb, cHits, cBb, cHbp, cSf, cTb), hr: cHr, rbi: cRbi },
      season: { games: sG, avg: avgFrom(sHits, sAb), ops: opsFrom(sAb, sHits, sBb, sHbp, sSf, sTb), hr: sHr, rbi: sRbi },
    };
  }

  return result;
}

module.exports = { buildHitterData, supaGet, supaPatch, TEAM_KO, TEAM_SHORT };
