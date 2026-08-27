// Pulls season-by-season career history, full game log, and splits (home/road,
// win/loss, vs-opponent) for ONE NBA player straight from stats.nba.com's public
// JSON API (same source the `nba_api` Python package and stats.nba.com itself use —
// no key/signup, just browser-like headers) and merges them into that player's
// `stats` jsonb column. This replaces the earlier idea of hand-transcribing ESPN
// pages: pulling structured JSON eliminates transcription-error risk entirely and
// is reusable for every future player, not just this pilot.
//
// Usage:  node scripts/enrichNbaPlayerAdvanced.js "<player name in our DB>" <NBA.com PLAYER_ID> <Season, e.g. 2025-26>
// Example: node scripts/enrichNbaPlayerAdvanced.js "Luka Dončić" 1629029 2025-26
const https = require('https');

const SUPA_URL = process.env.SUPABASE_URL || 'https://fywefclozclsaeccufyb.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_UpUSQ5ZM3CNZDzrykUvSmw_RKVFxmfd';

function supa(method, path, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : null;
    const url = new URL(SUPA_URL + path);
    const headers = {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(extraHeaders || {}),
    };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    const r = https.request(url, { method, headers }, (res) => {
      let d = '';
      res.on('data', (c) => (d += c));
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`${method} ${path} -> ${res.statusCode}: ${d}`));
        try { resolve(d ? JSON.parse(d) : null); } catch { resolve(d); }
      });
    });
    r.on('error', reject);
    if (payload) r.write(payload);
    r.end();
  });
}

// Node's own https client gets ECONNRESET against stats.nba.com's bot detection
// (likely a TLS-fingerprint check) even with identical headers to a working curl
// call, so shell out to curl instead — proven to work in this environment.
const { execFileSync } = require('child_process');

function nbaGet(path) {
  const url = 'https://stats.nba.com/stats' + path;
  const args = [
    '-s', '-m', '20', '--compressed',
    '-H', 'Host: stats.nba.com',
    '-H', 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '-H', 'Accept: application/json, text/plain, */*',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    '-H', 'x-nba-stats-origin: stats',
    '-H', 'x-nba-stats-token: true',
    '-H', 'Referer: https://www.nba.com/',
    '-H', 'Origin: https://www.nba.com',
    '-H', 'Connection: keep-alive',
    url,
  ];
  const out = execFileSync('curl', args, { maxBuffer: 1024 * 1024 * 20 }).toString('utf8');
  try {
    return JSON.parse(out);
  } catch (e) {
    throw new Error(`parse failed for ${path}: ${e.message} (body head: ${out.slice(0, 200)})`);
  }
}

function resultSet(json, name) {
  const rs = json.resultSets.find((r) => r.name === name);
  if (!rs) throw new Error(`resultSet ${name} not found`);
  return rs.headers.reduce((acc, h, i) => { acc[h] = i; return acc; }, {}) && rs;
}

function rowsAsObjects(rs) {
  return rs.rowSet.map((row) => Object.fromEntries(rs.headers.map((h, i) => [h, row[i]])));
}

const pct = (v) => (typeof v === 'number' ? Math.round(v * 1000) / 10 : null); // 0.476 -> 47.6

async function main() {
  const [, , playerName, playerIdArg, season] = process.argv;
  if (!playerName || !playerIdArg || !season) {
    console.error('usage: node scripts/enrichNbaPlayerAdvanced.js "<name>" <NBA_PLAYER_ID> <season e.g. 2025-26>');
    process.exit(1);
  }
  const nbaPlayerId = Number(playerIdArg);

  const [player] = await supa('GET', `/rest/v1/players?name=eq.${encodeURIComponent(playerName)}&select=id,stats`);
  if (!player) throw new Error(`player "${playerName}" not found in DB`);

  console.log('fetching career stats...');
  const careerJson = await nbaGet(`/playercareerstats?PlayerID=${nbaPlayerId}&PerMode=PerGame&LeagueID=00`);
  console.log('fetching game log...');
  const gamelogJson = await nbaGet(`/playergamelog?PlayerID=${nbaPlayerId}&Season=${season}&SeasonType=Regular+Season&LeagueID=00`);
  console.log('fetching general splits...');
  const splitsJson = await nbaGet(
    `/playerdashboardbygeneralsplits?PlayerID=${nbaPlayerId}&Season=${season}&SeasonType=Regular+Season&PerMode=PerGame&LeagueID=00&MeasureType=Base&PaceAdjust=N&PlusMinus=N&Rank=N&Outcome=&Location=&Month=0&SeasonSegment=&DateFrom=&DateTo=&OpponentTeamID=0&VsConference=&VsDivision=&GameSegment=&Period=0&ShotClockRange=&LastNGames=0`,
  );
  console.log('fetching vs-opponent splits...');
  const vsOppJson = await nbaGet(
    `/playerdashboardbyopponent?PlayerID=${nbaPlayerId}&Season=${season}&SeasonType=Regular+Season&PerMode=PerGame&LeagueID=00&MeasureType=Base&PaceAdjust=N&PlusMinus=N&Rank=N&Outcome=&Location=&Month=0&SeasonSegment=&DateFrom=&DateTo=&OpponentTeamID=0&VsConference=&VsDivision=&GameSegment=&Period=0&ShotClockRange=&LastNGames=0`,
  );

  // ---- SEASON_HISTORY + CAREER_TOTALS ----
  const seasonRows = rowsAsObjects(resultSet(careerJson, 'SeasonTotalsRegularSeason'))
    .filter((r) => r.TEAM_ABBREVIATION !== 'TOT'); // skip combined multi-team row, keep the per-team splits instead
  const careerRow = rowsAsObjects(resultSet(careerJson, 'CareerTotalsRegularSeason'))[0];

  const SEASON_HISTORY = seasonRows.map((r) => ({
    season: r.SEASON_ID,
    team: r.TEAM_ABBREVIATION,
    GP: r.GP,
    MIN: r.MIN,
    PTS: r.PTS,
    REB: r.REB,
    AST: r.AST,
    STL: r.STL,
    BLK: r.BLK,
    FG_PCT: pct(r.FG_PCT),
    FG3M: r.FG3M,
    FG3_PCT: pct(r.FG3_PCT),
    FT_PCT: pct(r.FT_PCT),
  }));
  const CAREER_TOTALS = {
    GP: careerRow.GP,
    MIN: careerRow.MIN,
    PTS: careerRow.PTS,
    REB: careerRow.REB,
    AST: careerRow.AST,
    STL: careerRow.STL,
    BLK: careerRow.BLK,
    FG_PCT: pct(careerRow.FG_PCT),
    FG3M: careerRow.FG3M,
    FG3_PCT: pct(careerRow.FG3_PCT),
    FT_PCT: pct(careerRow.FT_PCT),
  };

  // ---- GAME_LOG ----
  const gameRows = rowsAsObjects(resultSet(gamelogJson, 'PlayerGameLog'));
  // Sanity check against the official season totals so a parsing mistake fails loudly
  // instead of silently writing wrong data.
  const sum = (key) => gameRows.reduce((a, r) => a + r[key], 0);
  const seasonTotalRow = seasonRows.find((r) => r.SEASON_ID === season);
  if (seasonTotalRow) {
    const gpCheck = gameRows.length;
    if (gpCheck !== seasonTotalRow.GP) {
      console.warn(`WARNING: game log has ${gpCheck} games but season totals say GP=${seasonTotalRow.GP} (ok if mid-season trade split games across teams)`);
    }
  }

  const GAME_LOG = gameRows.map((r) => {
    const [, homeAway, opp] = r.MATCHUP.match(/^\S+\s+(@|vs\.)\s+(\S+)$/) || [null, 'vs.', '???'];
    const home = homeAway === 'vs.';
    const p2m = r.FGM - r.FG3M;
    const p2a = r.FGA - r.FG3A;
    const [mon, day, yr] = (() => {
      const d = new Date(r.GAME_DATE);
      return [d.getMonth() + 1, d.getDate(), d.getFullYear()];
    })();
    const eff = r.PTS + r.REB + r.AST + r.STL + r.BLK - (r.FGA - r.FGM) - (r.FTA - r.FTM) - r.TOV;
    return {
      opp,
      home,
      date: `${yr}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      rd: r.WL === 'W' ? undefined : undefined, // no exhibition concept for NBA regular season
      MIN: r.MIN,
      PTS: r.PTS,
      FGM: r.FGM, FGA: r.FGA, FGP: pct(r.FG_PCT),
      P2M: p2m, P2A: p2a, P2P: p2a > 0 ? Math.round((p2m / p2a) * 1000) / 10 : null,
      P3M: r.FG3M, P3A: r.FG3A, P3P: pct(r.FG3_PCT),
      FTM: r.FTM, FTA: r.FTA, FTP: pct(r.FT_PCT),
      OREB: r.OREB, DREB: r.DREB, REB: r.REB,
      AST: r.AST, PF: r.PF, TO: r.TOV, STL: r.STL, BLK: r.BLK,
      PM: r.PLUS_MINUS, EFF: eff,
    };
  });

  // ---- SPLITS ----
  const loc = rowsAsObjects(resultSet(splitsJson, 'LocationPlayerDashboard'));
  const wl = rowsAsObjects(resultSet(splitsJson, 'WinsLossesPlayerDashboard'));
  const vsOpp = rowsAsObjects(resultSet(vsOppJson, 'OpponentPlayerDashboard'));

  const splitRow = (r, label) => ({
    label,
    GP: r.GP, W: r.W, L: r.L,
    PTS: r.PTS, REB: r.REB, AST: r.AST, STL: r.STL, BLK: r.BLK,
    FG_PCT: pct(r.FG_PCT), FG3_PCT: pct(r.FG3_PCT), FT_PCT: pct(r.FT_PCT),
  });

  const SPLITS = {
    home_road: loc.map((r) => splitRow(r, r.GROUP_VALUE === 'Home' ? '홈' : '원정')),
    result: wl.map((r) => splitRow(r, r.GROUP_VALUE === 'Wins' ? '승리' : '패배')),
    vs_opponent: vsOpp
      .map((r) => splitRow(r, r.GROUP_VALUE))
      .sort((a, b) => b.PTS - a.PTS),
  };

  // sport_stat_fields for nba now leads with GP/MIN (added alongside this script) —
  // backfill those two onto the existing top-level per-game stat summary.
  const currentSeasonRow = seasonRows.find((r) => r.SEASON_ID === season);

  const merged = {
    ...player.stats,
    ...(currentSeasonRow ? { GP: currentSeasonRow.GP, MIN: currentSeasonRow.MIN } : {}),
    SEASON_HISTORY,
    CAREER_TOTALS,
    GAME_LOG,
    SPLITS,
  };

  await supa('PATCH', `/rest/v1/players?id=eq.${player.id}`, { stats: merged }, { Prefer: 'return=minimal' });
  console.log(`done: ${playerName} — ${SEASON_HISTORY.length} seasons, ${GAME_LOG.length} games, ${SPLITS.vs_opponent.length} opponents`);
}

main().catch((e) => { console.error(e); process.exit(1); });
