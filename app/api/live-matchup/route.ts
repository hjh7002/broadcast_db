import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
import { koreanNameForMlbTeamId, sameDivision, shortNameForMlbTeamId } from "@/lib/mlbTeams";

const FASTBALL = new Set(["FF", "SI", "FC"]);
const BREAKING = new Set(["SL", "CU", "KC", "ST", "SV", "SC"]);
const OFFSPEED = new Set(["CH", "FS", "FO", "KN", "EP"]);
const PITCH_KO: Record<string, string> = {
  FF: "포심 패스트볼", SI: "싱커", FC: "커터", SL: "슬라이더", ST: "스위퍼", SV: "스위퍼",
  CU: "커브", KC: "너클커브", CH: "체인지업", FS: "스플리터", FO: "포크볼", KN: "너클볼",
  SC: "스크류볼", EP: "이피터",
};

async function mlbGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}
async function savantGet(url: string): Promise<string> {
  const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } });
  return res.text();
}
async function savantJson(url: string) {
  const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } });
  return res.json();
}

// Very simple CSV line splitter — good enough for Savant's leaderboard exports, which
// only ever quote the "Last, First" name column (the one field containing a comma).
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

async function getSprintSpeedMap(): Promise<Map<number, number>> {
  try {
    const csv = await savantGet(`https://baseballsavant.mlb.com/leaderboard/sprint_speed?year=2026&position=&team=&min=0&csv=true`);
    const lines = csv.trim().split("\n");
    const header = splitCsvLine(lines[0]);
    const idIdx = header.indexOf("player_id");
    const speedIdx = header.indexOf("sprint_speed");
    const map = new Map<number, number>();
    for (const line of lines.slice(1)) {
      const cols = splitCsvLine(line);
      const id = parseInt(cols[idIdx]?.replace(/"/g, ""), 10);
      const speed = parseFloat(cols[speedIdx]?.replace(/"/g, ""));
      if (id && !isNaN(speed)) map.set(id, speed);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function getOaaMap(): Promise<Map<string, number>> {
  try {
    const csv = await savantGet(`https://baseballsavant.mlb.com/leaderboard/outs_above_average?year=2026&type=Fielder&min=1&csv=true`);
    const lines = csv.trim().split("\n");
    const header = splitCsvLine(lines[0]);
    const nameIdx = header.indexOf("last_name, first_name");
    const oaaIdx = header.indexOf("outs_above_average");
    const map = new Map<string, number>();
    for (const line of lines.slice(1)) {
      const cols = splitCsvLine(line);
      const rawName = cols[nameIdx]?.replace(/"/g, "").trim();
      const oaa = parseInt(cols[oaaIdx]?.replace(/"/g, ""), 10);
      if (!rawName || isNaN(oaa)) continue;
      const [last, first] = rawName.split(",").map((s) => s.trim());
      if (first && last) map.set(`${first} ${last}`, oaa);
    }
    return map;
  } catch {
    return new Map();
  }
}

function extractFielder(des: string | undefined): { position: string; name: string } | null {
  const m = /(pitcher|catcher|first baseman|second baseman|third baseman|shortstop|left fielder|center fielder|right fielder) ([A-Z][A-Za-z.'-]+(?: [A-Z][A-Za-z.'-]+)*)/.exec(
    des || "",
  );
  if (!m) return null;
  return { position: m[1], name: m[2].replace(/[.,]+$/, "").trim() };
}

const FIELD_POSITION_KO: Record<string, string> = {
  pitcher: "투수", catcher: "포수", "first baseman": "1루수", "second baseman": "2루수",
  "third baseman": "3루수", shortstop: "유격수", "left fielder": "좌익수", "center fielder": "중견수", "right fielder": "우익수",
};

async function getGameFeedHighlights(gamePk: number, oaaMap: Map<string, number>) {
  try {
    const gf = await savantJson(`https://baseballsavant.mlb.com/gf?game_pk=${gamePk}`);
    const allEvents: any[] = gf.exit_velocity || [];

    const homeRunEvents = allEvents.filter((e) => e.result === "Home Run" && e.contextMetrics?.homeRunBallparks != null);
    const recentHomeRuns = homeRunEvents
      .sort((a, b) => (a.ab_number ?? 0) - (b.ab_number ?? 0))
      .slice(-3)
      .map((e) => ({
        playId: e.play_id, batterName: e.batter_name, ballparks: e.contextMetrics.homeRunBallparks,
        inning: e.inning, halfInning: e.half_inning, exitVelo: e.launch_speed, distance: e.hit_distance,
      }));

    // "surprising" batted balls — very low xBA that still fell in, or very high xBA that
    // still got caught — surfaced with the fielder's season OAA as the payoff stat.
    const surprising = allEvents.filter((e) => {
      const xba = parseFloat(e.xba);
      if (isNaN(xba)) return false;
      const isOut = e.is_bip_out === "Y";
      return (xba < 0.2 && !isOut) || (xba >= 0.8 && isOut);
    });
    const latest = surprising.sort((a, b) => (a.ab_number ?? 0) - (b.ab_number ?? 0)).slice(-1)[0];
    let defensiveHighlight = null;
    if (latest) {
      const fielder = extractFielder(latest.des);
      if (fielder) {
        defensiveHighlight = {
          playId: latest.play_id,
          batterName: latest.batter_name,
          fielderName: fielder.name,
          position: FIELD_POSITION_KO[fielder.position] || fielder.position,
          xba: latest.xba,
          isOut: latest.is_bip_out === "Y",
          oaa: oaaMap.get(fielder.name) ?? null,
        };
      }
    }

    return { recentHomeRuns, defensiveHighlight };
  } catch {
    return { recentHomeRuns: [], defensiveHighlight: null };
  }
}

function ipToOuts(ip: string | undefined): number {
  const [w, f] = String(ip || "0.0").split(".");
  return parseInt(w, 10) * 3 + (f ? parseInt(f, 10) : 0);
}
function avgFrom(hits: number, ab: number): string {
  return ab > 0 ? (hits / ab).toFixed(3).replace(/^0/, "") : ".000";
}
function fmt3(n: number): string {
  return (n < 0 ? "-" : "") + Math.abs(n).toFixed(3).replace(/^0/, "");
}
function outsToIp(outs: number): string {
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}
// The game feed's own `officialDate` — the same US-local calendar date MLB stamps on
// every gameLog/schedule entry for this game. Using `new Date()` (UTC) here was a real
// bug: for a typical evening ET game, UTC has already rolled over to the next calendar
// day well before the game ends, so "today" no longer matched the game's actual date
// and every "exclude today's in-progress game" filter below silently stopped excluding it.
function todayStr(feed: any): string {
  return feed?.gameData?.datetime?.officialDate || new Date().toISOString().slice(0, 10);
}

// Head-to-head PA totals for this exact pitcher-batter pair from *today's* game only,
// so they can be subtracted back out of the (already live-updating) MLB vsPlayerTotal
// total — every matchup/series/streak stat on this panel is meant to stay frozen at
// its pre-game value rather than tick during the broadcast.
function getTodayH2H(feed: any, pitcherId: number, batterId: number) {
  const allPlays = feed?.liveData?.plays?.allPlays || [];
  let ab = 0, hits = 0, hr = 0, bb = 0, hbp = 0, sf = 0, tb = 0, so = 0;
  for (const p of allPlays) {
    if (!p.about?.isComplete) continue;
    if (p.matchup?.pitcher?.id !== pitcherId || p.matchup?.batter?.id !== batterId) continue;
    const et = p.result?.eventType;
    if (!et) continue;
    const isBB = et === "walk" || et === "intent_walk";
    const isHBP = et === "hit_by_pitch";
    const isSF = et === "sac_fly" || et === "sac_fly_double_play";
    const isSH = et === "sac_bunt";
    const isCI = et === "catcher_interf";
    if (isBB) bb++;
    if (isHBP) hbp++;
    if (isSF) sf++;
    if (!isBB && !isHBP && !isSF && !isSH && !isCI) ab++;
    if (et === "single") { hits++; tb += 1; }
    else if (et === "double") { hits++; tb += 2; }
    else if (et === "triple") { hits++; tb += 3; }
    else if (et === "home_run") { hits++; tb += 4; hr++; }
    if (et === "strikeout" || et === "strikeout_double_play") so++;
  }
  return { ab, hits, hr, bb, hbp, sf, tb, so };
}

// MLB's `statSplits` stat type has no date-bounding param (verified: passing `date=`
// has no effect), so hand/runner-situation splits live-update through an in-progress
// game just like `vsPlayerTotal` does for matchup history. Unlike that stat type though,
// there's no single official aggregate to subtract from — so today's contribution is
// rebuilt here play-by-play from the live feed (same source `getTodayH2H` uses) and
// subtracted per split bucket, keeping splits frozen at their pre-game value too.
function getTodaySplitDeltas(feed: any, personId: number, group: "hitting" | "pitching") {
  const allPlays = feed?.liveData?.plays?.allPlays || [];
  const hand: Record<string, { ab: number; hits: number }> = { vl: { ab: 0, hits: 0 }, vr: { ab: 0, hits: 0 } };
  const runner: Record<string, { ab: number; hits: number }> = {
    r0: { ab: 0, hits: 0 }, ron: { ab: 0, hits: 0 }, risp: { ab: 0, hits: 0 }, risp2: { ab: 0, hits: 0 },
  };
  const loaded = { ab: 0, hits: 0, hr: 0 };
  let outsSoFar = 0;
  let halfKey = "";
  for (const p of allPlays) {
    if (!p.about?.isComplete) continue;
    const thisHalfKey = `${p.about?.inning}-${p.about?.halfInning}`;
    if (thisHalfKey !== halfKey) { halfKey = thisHalfKey; outsSoFar = 0; }
    const outsAtStart = outsSoFar;
    if (typeof p.count?.outs === "number") outsSoFar = p.count.outs;

    const isPitcher = group === "pitching";
    if ((isPitcher ? p.matchup?.pitcher?.id : p.matchup?.batter?.id) !== personId) continue;
    const et = p.result?.eventType;
    if (!et) continue;
    const isBB = et === "walk" || et === "intent_walk";
    const isHBP = et === "hit_by_pitch";
    const isSF = et === "sac_fly" || et === "sac_fly_double_play";
    const isSH = et === "sac_bunt";
    const isCI = et === "catcher_interf";
    const isAB = !isBB && !isHBP && !isSF && !isSH && !isCI;
    const isHit = et === "single" || et === "double" || et === "triple" || et === "home_run";
    if (!isAB) continue; // sitCodes splits are AB/hits based — walks etc. don't move either number

    const handCode = isPitcher ? p.matchup?.batSide?.code : p.matchup?.pitchHand?.code;
    const handBucket = handCode === "L" ? "vl" : handCode === "R" ? "vr" : null;
    if (handBucket) { hand[handBucket].ab += 1; if (isHit) hand[handBucket].hits += 1; }

    const menOnBase = p.matchup?.splits?.menOnBase;
    const runnerBuckets: string[] = [];
    if (menOnBase === "Empty") runnerBuckets.push("r0");
    else if (menOnBase === "Men_On") runnerBuckets.push("ron");
    else if (menOnBase === "RISP" || menOnBase === "Loaded") {
      runnerBuckets.push("ron", "risp");
      if (outsAtStart === 2) runnerBuckets.push("risp2");
    }
    for (const b of runnerBuckets) { runner[b].ab += 1; if (isHit) runner[b].hits += 1; }
    if (menOnBase === "Loaded") {
      loaded.ab += 1;
      if (isHit) loaded.hits += 1;
      if (et === "home_run") loaded.hr += 1;
    }
  }
  return { hand, runner, loaded };
}

function kstDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

async function findTodayGamePk(teamAId: number, teamBId: number): Promise<number | null> {
  // MLB's schedule `date` bucket is roughly the US-local date, which for most evening
  // games is one calendar day behind the KST date the broadcast is actually watched on
  // (e.g. a 7pm ET game lands after midnight in Korea). Fetching yesterday-through-today
  // (US-bucket terms) and matching each game's real UTC `gameDate` against today's KST
  // date is the only precise way to find "today's" game from a Korean broadcaster's POV.
  const kstToday = kstDateStr(new Date());
  const startDate = kstDateStr(new Date(Date.now() - 2 * 86400000));
  const data = await mlbGet(
    `https://statsapi.mlb.com/api/v1/schedule?teamId=${teamAId}&startDate=${startDate}&endDate=${kstToday}&sportId=1`,
  );
  for (const d of data.dates || []) {
    for (const g of d.games || []) {
      if (kstDateStr(new Date(g.gameDate)) !== kstToday) continue;
      const awayId = g.teams?.away?.team?.id;
      const homeId = g.teams?.home?.team?.id;
      if ((awayId === teamAId && homeId === teamBId) || (awayId === teamBId && homeId === teamAId)) {
        return g.gamePk;
      }
    }
  }
  return null;
}

async function getPitcherSeasonHighs(personId: number, feed: any) {
  const d = await mlbGet(
    `https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=2026`,
  );
  const today = todayStr(feed);
  const games = (d.stats?.[0]?.splits || []).filter((g: any) => g.date !== today);
  if (games.length === 0) return null;

  function bestGame(key: "strikeOuts" | "baseOnBalls" | "homeRuns") {
    let best = games[0];
    for (const g of games) {
      if ((g.stat[key] || 0) > (best.stat[key] || 0)) best = g;
    }
    return { value: best.stat[key] || 0, date: best.date, opponent: best.opponent?.name ?? "" };
  }

  return {
    strikeOuts: bestGame("strikeOuts"),
    baseOnBalls: bestGame("baseOnBalls"),
    homeRuns: bestGame("homeRuns"),
  };
}

function getTodayPitcherLine(feed: any, side: "home" | "away", personId: number) {
  const p = feed?.liveData?.boxscore?.teams?.[side]?.players?.[`ID${personId}`];
  const s = p?.stats?.pitching;
  if (!s) return null;
  return { strikeOuts: s.strikeOuts || 0, baseOnBalls: s.baseOnBalls || 0, homeRuns: s.homeRuns || 0 };
}

function getCatcherOnField(feed: any, side: "home" | "away"): { id: number; name: string } | null {
  const players = feed?.liveData?.boxscore?.teams?.[side]?.players || {};
  for (const key of Object.keys(players)) {
    const p = players[key];
    if (p.position?.code === "2" && p.gameStatus && !p.gameStatus.isOnBench) {
      return { id: p.person.id, name: p.person.fullName };
    }
  }
  return null;
}

// Today's SB/CS for this exact person, straight from the live boxscore's own per-player
// stat block — MLB has already attributed it correctly (pitcher's own pitching line,
// catcher's own fielding line), so this is simpler and more reliable than re-deriving
// "who was catching" from play-by-play events.
function getTodaySbDelta(feed: any, side: "home" | "away", personId: number, statBlockKey: "pitching" | "fielding" | "batting") {
  const p = feed?.liveData?.boxscore?.teams?.[side]?.players?.[`ID${personId}`];
  const s = p?.stats?.[statBlockKey];
  if (!s) return { sb: 0, cs: 0 };
  return { sb: s.stolenBases || 0, cs: s.caughtStealing || 0 };
}

async function getStolenBaseDefense(
  personId: number,
  group: "pitching" | "catching",
  todayDelta: { sb: number; cs: number } = { sb: 0, cs: 0 },
) {
  async function line(statType: string) {
    try {
      const d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=${statType}&group=${group}`);
      const s = d.stats?.[0]?.splits?.[0]?.stat;
      if (!s) return null;
      const cs = Math.max(0, (s.caughtStealing || 0) - todayDelta.cs);
      const sb = Math.max(0, (s.stolenBases || 0) - todayDelta.sb);
      const attempts = cs + sb;
      return { cs, attempts, pct: attempts > 0 ? Math.round((cs / attempts) * 100) : 0 };
    } catch {
      return null;
    }
  }
  const [season, career] = await Promise.all([line("season"), line("career")]);
  return { season, career };
}

// Recent-appearance log for a reliever taking the mound — not shown for the starter,
// who already pitches on a predictable schedule the broadcaster already knows/sees
// elsewhere; a bullpen arm's workload over the last week is the useful unknown here.
async function getRecentBullpenOutings(personId: number, feed: any): Promise<string[]> {
  const d = await mlbGet(
    `https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=2026`,
  );
  const games = d.stats?.[0]?.splits || [];
  const today = todayStr(feed);
  const cutoff = Date.now() - 7 * 86400000;
  const recent = games
    .filter((g: any) => g.date !== today && new Date(g.date).getTime() >= cutoff)
    .sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

  return recent.map((g: any) => {
    const s = g.stat;
    const [, m, dd] = g.date.split("-");
    const oppShort = (g.opponent?.id && shortNameForMlbTeamId(g.opponent.id)) || g.opponent?.name || "";
    let decision = "";
    if ((s.saves || 0) > 0) decision = " SV";
    else if ((s.wins || 0) > 0) decision = " W";
    else if ((s.losses || 0) > 0) decision = " L";
    else if ((s.holds || 0) > 0) decision = " HLD";
    return `${parseInt(m, 10)}/${parseInt(dd, 10)} ${oppShort} ${s.inningsPitched}이닝 ${s.runs || 0}실점 ${s.numberOfPitches || 0}구${decision}`;
  });
}

// Surfaces season-high K/BB/HR only as a news-ticker blip when the pitcher is actually
// closing in on it live (tied, broken, or one away) — a card that always shows the
// season high regardless of today's count isn't worth watching continuously.
function nearSeasonHighFacts(
  seasonHighs: Awaited<ReturnType<typeof getPitcherSeasonHighs>>,
  today: ReturnType<typeof getTodayPitcherLine>,
): string[] {
  if (!seasonHighs || !today) return [];
  const facts: string[] = [];
  const checks: { key: "strikeOuts" | "baseOnBalls" | "homeRuns"; label: string }[] = [
    { key: "strikeOuts", label: "탈삼진" },
    { key: "baseOnBalls", label: "볼넷" },
    { key: "homeRuns", label: "피홈런" },
  ];
  for (const { key, label } of checks) {
    const high = seasonHighs[key];
    const cur = today[key];
    if (!high || high.value <= 0 || cur <= 0) continue;
    if (cur >= high.value) {
      facts.push(`오늘 ${cur}${label} — 시즌 최다 ${cur > high.value ? "경신" : "타이"} (기존 ${high.value}개, ${high.date})`);
    } else if (cur === high.value - 1) {
      facts.push(`오늘 ${cur}${label} — 시즌 최다(${high.value}개) 1개 차`);
    }
  }
  return facts;
}

async function getHandednessSplits(
  personId: number,
  group: "hitting" | "pitching",
  todayHandDelta?: Record<string, { ab: number; hits: number }>,
) {
  const d = await mlbGet(
    `https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=statSplits&group=${group}&sitCodes=vl,vr&season=2026`,
  );
  const splits = d.stats?.[0]?.splits || [];
  const byCode: Record<string, { hits: number; ab: number }> = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { hits: 0, ab: 0 };
    byCode[code].hits += s.stat.hits || 0;
    byCode[code].ab += s.stat.atBats || 0;
  }
  if (todayHandDelta) {
    for (const code of Object.keys(byCode)) {
      const delta = todayHandDelta[code];
      if (!delta) continue;
      byCode[code].ab = Math.max(0, byCode[code].ab - delta.ab);
      byCode[code].hits = Math.max(0, byCode[code].hits - delta.hits);
    }
  }
  // pitching group: "vs Left"/"vs Right" describes the opposing BATTER's hand.
  // hitting group: it describes the opposing PITCHER's hand.
  const label: Record<string, string> =
    group === "pitching" ? { vl: "좌타자 상대", vr: "우타자 상대" } : { vl: "좌투수 상대", vr: "우투수 상대" };
  const order = ["vl", "vr"];
  return order.filter((code) => byCode[code]).map((code) => ({ label: label[code], avg: avgFrom(byCode[code].hits, byCode[code].ab) }));
}

const RUNNER_SIT_LABEL: Record<string, string> = {
  r0: "주자 없음",
  ron: "주자 있음",
  risp: "득점권",
  risp2: "2사 득점권",
};
const RUNNER_SIT_ORDER = ["r0", "ron", "risp", "risp2"];

async function getRunnerSplits(
  personId: number,
  group: "hitting" | "pitching",
  todayRunnerDelta?: Record<string, { ab: number; hits: number }>,
) {
  const d = await mlbGet(
    `https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=statSplits&group=${group}&sitCodes=r0,ron,risp,risp2&season=2026`,
  );
  const splits = d.stats?.[0]?.splits || [];
  const byCode: Record<string, { hits: number; ab: number }> = {};
  for (const s of splits) {
    const code = s.split.code;
    if (!byCode[code]) byCode[code] = { hits: 0, ab: 0 };
    byCode[code].hits += s.stat.hits || 0;
    byCode[code].ab += s.stat.atBats || 0;
  }
  if (todayRunnerDelta) {
    for (const code of Object.keys(byCode)) {
      const delta = todayRunnerDelta[code];
      if (!delta) continue;
      byCode[code].ab = Math.max(0, byCode[code].ab - delta.ab);
      byCode[code].hits = Math.max(0, byCode[code].hits - delta.hits);
    }
  }
  return RUNNER_SIT_ORDER.filter((code) => byCode[code]).map((code) => ({
    label: RUNNER_SIT_LABEL[code],
    avg: avgFrom(byCode[code].hits, byCode[code].ab),
    ab: byCode[code].ab,
    hits: byCode[code].hits,
  }));
}

// Only worth calling once the bases are actually loaded right now — the career half needs
// one statSplits(sitCodes=r123) call per season since the batter's debut, so this stays
// gated behind the live base/out state rather than running on every poll.
async function getBasesLoadedStat(
  personId: number,
  group: "hitting" | "pitching",
  todayLoadedDelta?: { ab: number; hits: number; hr: number },
) {
  const bioData = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}`);
  const debutDate: string | undefined = bioData.people?.[0]?.mlbDebutDate;
  const debutYear = debutDate ? parseInt(debutDate.split("-")[0], 10) : 2026;

  async function forSeason(season: number) {
    const d = await mlbGet(
      `https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=statSplits&group=${group}&sitCodes=r123&season=${season}`,
    );
    const split = (d.stats?.[0]?.splits || []).find((s: any) => s.split.code === "r123");
    return { ab: split?.stat.atBats || 0, hits: split?.stat.hits || 0, hr: split?.stat.homeRuns || 0 };
  }

  const seasonTotalRaw = await forSeason(2026);
  const seasonTotal = todayLoadedDelta
    ? {
        ab: Math.max(0, seasonTotalRaw.ab - todayLoadedDelta.ab),
        hits: Math.max(0, seasonTotalRaw.hits - todayLoadedDelta.hits),
        hr: Math.max(0, seasonTotalRaw.hr - todayLoadedDelta.hr),
      }
    : seasonTotalRaw;

  let cAb = 0, cHits = 0, cHr = 0;
  for (let yr = debutYear; yr <= 2026; yr++) {
    try {
      const t = yr === 2026 ? seasonTotalRaw : await forSeason(yr);
      cAb += t.ab; cHits += t.hits; cHr += t.hr;
    } catch { /* skip that season */ }
  }
  if (todayLoadedDelta) {
    cAb = Math.max(0, cAb - todayLoadedDelta.ab);
    cHits = Math.max(0, cHits - todayLoadedDelta.hits);
    cHr = Math.max(0, cHr - todayLoadedDelta.hr);
  }

  return {
    season: { ab: seasonTotal.ab, hits: seasonTotal.hits, avg: avgFrom(seasonTotal.hits, seasonTotal.ab), grandSlams: seasonTotal.hr },
    career: { ab: cAb, hits: cHits, avg: avgFrom(cHits, cAb), grandSlams: cHr },
  };
}

async function getMatchupHistory(
  pitcherId: number,
  batterId: number,
  pitcherTeamId: number,
  batterTeamId: number,
  feed: any,
) {
  const d = await mlbGet(
    `https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=vsPlayerTotal&group=hitting&opposingPlayerId=${pitcherId}`,
  );
  const s = d.stats?.[0]?.splits?.[0]?.stat;
  // vsPlayerTotal is a live-updating official aggregate that already includes any at-bats
  // from today's in-progress game between this exact pair, so today's contribution (if any)
  // is subtracted back out here to keep this frozen at its pre-game value all broadcast long.
  const today = getTodayH2H(feed, pitcherId, batterId);
  const career = s
    ? (() => {
        const ab = Math.max(0, (s.atBats ?? 0) - today.ab);
        const hits = Math.max(0, (s.hits ?? 0) - today.hits);
        const hr = Math.max(0, (s.homeRuns ?? 0) - today.hr);
        const bb = Math.max(0, (s.baseOnBalls ?? 0) - today.bb);
        const so = Math.max(0, (s.strikeOuts ?? 0) - today.so);
        const hbp = Math.max(0, (s.hitByPitch ?? 0) - today.hbp);
        const sf = Math.max(0, (s.sacFlies ?? 0) - today.sf);
        const tb = Math.max(0, (s.totalBases ?? 0) - today.tb);
        const obpDenom = ab + bb + hbp + sf;
        const obp = obpDenom > 0 ? (hits + bb + hbp) / obpDenom : 0;
        const slg = ab > 0 ? tb / ab : 0;
        return { ab, hits, avg: avgFrom(hits, ab), hr, bb, so, obp: fmt3(obp), slg: fmt3(slg) };
      })()
    : null;

  // MLB's `vsPlayer` stat type ignores the `season` param and always returns the career total,
  // so "this season vs this exact pitcher" is approximated: games this pitcher started against
  // the batter's team this season, cross-referenced with the batter's box line that same date.
  // Only meaningful for same-division opponents — teams outside the division rarely meet more
  // than once a season, so a "this season" split for anyone else is usually just the career total.
  // Today's date is excluded so this stays frozen at its pre-game value during the broadcast.
  let seasonApprox = null;
  try {
    if (!sameDivision(pitcherTeamId, batterTeamId)) throw new Error("not same division");
    const today2 = todayStr(feed);
    const pitcherLog = await mlbGet(
      `https://statsapi.mlb.com/api/v1/people/${pitcherId}/stats?stats=gameLog&group=pitching&season=2026`,
    );
    const startDates = new Set(
      (pitcherLog.stats?.[0]?.splits || [])
        .filter((g: any) => g.opponent?.id === batterTeamId && g.date !== today2)
        .map((g: any) => g.date),
    );
    if (startDates.size > 0) {
      const batterLog = await mlbGet(
        `https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=gameLog&group=hitting&season=2026`,
      );
      const relevant = (batterLog.stats?.[0]?.splits || []).filter(
        (g: any) => g.opponent?.id === pitcherTeamId && g.date !== today2 && startDates.has(g.date),
      );
      if (relevant.length > 0) {
        const totals = relevant.reduce(
          (acc: any, g: any) => {
            acc.ab += g.stat.atBats || 0; acc.hits += g.stat.hits || 0; acc.hr += g.stat.homeRuns || 0;
            return acc;
          },
          { ab: 0, hits: 0, hr: 0 },
        );
        seasonApprox = { games: relevant.length, ab: totals.ab, hits: totals.hits, avg: avgFrom(totals.hits, totals.ab), hr: totals.hr };
      }
    }
  } catch { /* leave seasonApprox null */ }

  return { career, seasonApprox };
}

async function getBatterSeriesAndStreak(batterId: number, opponentTeamId: number, feed: any) {
  const d = await mlbGet(
    `https://statsapi.mlb.com/api/v1/people/${batterId}/stats?stats=gameLog&group=hitting&season=2026`,
  );
  const games = (d.stats?.[0]?.splits || []).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

  // "이번 시리즈" excludes today's in-progress game so it stays frozen at its pre-game
  // value, same as the hit streak below — otherwise the AB/H line would tick up live.
  const now = Date.now();
  const today = todayStr(feed);
  const reduceGames = (list: any[]) =>
    list.reduce(
      (acc: any, g: any) => {
        acc.ab += g.stat.atBats || 0;
        acc.hits += g.stat.hits || 0;
        acc.doubles += g.stat.doubles || 0;
        acc.triples += g.stat.triples || 0;
        acc.hr += g.stat.homeRuns || 0;
        acc.bb += g.stat.baseOnBalls || 0;
        acc.sb += g.stat.stolenBases || 0;
        acc.gidp += g.stat.groundIntoDoublePlay || 0;
        return acc;
      },
      { ab: 0, hits: 0, doubles: 0, triples: 0, hr: 0, bb: 0, sb: 0, gidp: 0 },
    );

  const seriesGames = games.filter((g: any) => {
    if (!g.opponent || g.opponent.id !== opponentTeamId) return false;
    if (g.date === today) return false;
    const days = (now - new Date(g.date).getTime()) / 86400000;
    return days <= 10;
  });

  let series: any = { ...reduceGames(seriesGames), games: seriesGames.length, isPrevious: false, opponentId: null as number | null };

  // If there are no games yet against the current opponent, today is the first game of a
  // new series — show the just-finished previous series in full instead of an empty line.
  // A "series" here is simply a run of consecutive games (excluding today) against the
  // same opponent, walked back from the most recent completed game.
  if (seriesGames.length === 0) {
    const priorGames = games.filter((g: any) => g.date !== today);
    const prevOpponentId = priorGames[0]?.opponent?.id ?? null;
    if (prevOpponentId) {
      const prevSeriesGames: any[] = [];
      for (const g of priorGames) {
        if (g.opponent?.id !== prevOpponentId) break;
        prevSeriesGames.push(g);
      }
      series = {
        ...reduceGames(prevSeriesGames),
        games: prevSeriesGames.length,
        isPrevious: true,
        opponentId: prevOpponentId,
        opponentName: koreanNameForMlbTeamId(prevOpponentId),
      };
    }
  }

  // "연속 경기 안타" is frozen as of the last COMPLETED game — today's in-progress game
  // (which already has a partial live line by the time the batter's first PA is over)
  // must not tick this streak up or down until it's actually final.
  const gamesForStreak = games.filter((g: any) => g.date !== today);

  let streakType: "hit" | "hitless" | null = null;
  const streakGames: any[] = [];
  for (const g of gamesForStreak) {
    if ((g.stat.atBats || 0) === 0) continue;
    const hadHit = (g.stat.hits || 0) > 0;
    if (streakType === null) {
      streakType = hadHit ? "hit" : "hitless";
      streakGames.push(g);
    } else if ((streakType === "hit") === hadHit) {
      streakGames.push(g);
    } else {
      break;
    }
  }

  let streak = null;
  if (streakType) {
    const totals = streakGames.reduce(
      (acc, g) => {
        acc.ab += g.stat.atBats || 0;
        acc.hits += g.stat.hits || 0;
        acc.hr += g.stat.homeRuns || 0;
        acc.bb += g.stat.baseOnBalls || 0;
        acc.hbp += g.stat.hitByPitch || 0;
        acc.sf += g.stat.sacFlies || 0;
        acc.tb += g.stat.totalBases || 0;
        return acc;
      },
      { ab: 0, hits: 0, hr: 0, bb: 0, hbp: 0, sf: 0, tb: 0 },
    );
    const obpDenom = totals.ab + totals.bb + totals.hbp + totals.sf;
    const obp = obpDenom > 0 ? (totals.hits + totals.bb + totals.hbp) / obpDenom : 0;
    const slg = totals.ab > 0 ? totals.tb / totals.ab : 0;
    streak = {
      type: streakType,
      games: streakGames.length,
      ab: totals.ab,
      hits: totals.hits,
      hr: totals.hr,
      bb: totals.bb,
      hbp: totals.hbp,
      avg: avgFrom(totals.hits, totals.ab),
      ops: fmt3(obp + slg),
    };
  }

  // "연속 경기 출루" is a separate streak from the hit/hitless one above: a game counts
  // if the batter reached base via a hit, walk, or HBP specifically — reaching on an
  // error or fielder's choice doesn't touch any of those three stat categories, so this
  // condition naturally excludes them without needing play-by-play data. Also frozen at
  // the last completed game, same as the hit streak.
  let obGames = 0, obAb = 0, obHits = 0, obBb = 0, obHbp = 0;
  for (const g of gamesForStreak) {
    const ab = g.stat.atBats || 0;
    const bb = g.stat.baseOnBalls || 0;
    const hbp = g.stat.hitByPitch || 0;
    if (ab === 0 && bb === 0 && hbp === 0) continue; // no real PA that game — skip, don't break
    const reachedBase = (g.stat.hits || 0) > 0 || bb > 0 || hbp > 0;
    if (!reachedBase) break;
    obGames += 1;
    obAb += ab;
    obHits += g.stat.hits || 0;
    obBb += bb;
    obHbp += hbp;
  }
  const onBaseStreak =
    obGames > 0 ? { games: obGames, ab: obAb, hits: obHits, bb: obBb, hbp: obHbp, avg: avgFrom(obHits, obAb) } : null;

  return { series, streak, onBaseStreak };
}

async function getBatterPitchCategoryAvg(batterId: number) {
  const html = await savantGet(
    `https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=${batterId}&position=&hand=&pitchBreakdown=pitches&timeFrame=yearly&season=&pitchType=&count=&gameType=&updatePitches=true`,
  );
  const m = html.match(/window\.serverVals\.pitchDetails\s*=\s*(\[.*?\])\s*(?:;|\n)/s);
  if (!m) return null;
  const arr = JSON.parse(m[1]) as any[];
  const y2026 = arr.filter((p) => p.year === 2026);
  const buckets = { 패스트볼: { hits: 0, ab: 0 }, 브레이킹볼: { hits: 0, ab: 0 }, 오프스피드: { hits: 0, ab: 0 } };
  for (const p of y2026) {
    const hits = parseInt(p.hits, 10) || 0;
    const ab = parseInt(p.ab, 10) || 0;
    if (FASTBALL.has(p.api_pitch_type)) { buckets.패스트볼.hits += hits; buckets.패스트볼.ab += ab; }
    else if (BREAKING.has(p.api_pitch_type)) { buckets.브레이킹볼.hits += hits; buckets.브레이킹볼.ab += ab; }
    else if (OFFSPEED.has(p.api_pitch_type)) { buckets.오프스피드.hits += hits; buckets.오프스피드.ab += ab; }
  }
  return Object.entries(buckets)
    .filter(([, v]) => v.ab > 0)
    .map(([label, v]) => ({ label, avg: avgFrom(v.hits, v.ab) }));
}

async function getPitcherPitchMix(pitcherId: number) {
  try {
    const html = await savantGet(
      `https://baseballsavant.mlb.com/player-services/statcast-pitches-breakdown?playerId=${pitcherId}&position=1&hand=&pitchBreakdown=pitches&timeFrame=yearly&season=&pitchType=&count=&gameType=&updatePitches=true`,
    );
    const m = html.match(/window\.serverVals\.pitchDetails\s*=\s*(\[.*?\])\s*(?:;|\n)/s);
    if (!m) return null;
    const arr = JSON.parse(m[1]) as any[];
    const y2026 = arr.filter((p) => p.year === 2026).sort((a, b) => parseFloat(b.pitch_percent) - parseFloat(a.pitch_percent));
    return y2026.map((p) => ({
      type: p.api_pitch_type,
      typeKo: PITCH_KO[p.api_pitch_type] || p.api_pitch_type,
      usage: `${p.pitch_percent}%`,
      velo: `${p.release_speed} mph`,
      ba: p.ba,
      hr: parseInt(p.hr, 10) || 0,
      whiff: `${p.whiff_percent}%`,
    }));
  } catch {
    return null;
  }
}

async function getTeamHistory(personId: number, group: "hitting" | "pitching") {
  const d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=yearByYear&group=${group}`);
  const splits = d.stats?.[0]?.splits || [];
  const history: { teamId: number; season: number }[] = [];
  for (const s of splits) {
    if (s.team?.id) history.push({ teamId: s.team.id, season: parseInt(s.season, 10) });
  }
  return history;
}

async function getPitcherVsOpponentRecord(personId: number, opponentTeamId: number, seasons: number[], feed: any) {
  const today = todayStr(feed);
  let careerG = 0, careerW = 0, careerL = 0, careerOuts = 0, careerEr = 0;
  let seasonG = 0, seasonW = 0, seasonL = 0, seasonOuts = 0, seasonEr = 0;
  for (const yr of seasons) {
    let d;
    try {
      d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=pitching&season=${yr}`);
    } catch { continue; }
    const games = d.stats?.[0]?.splits || [];
    for (const g of games) {
      if (!g.opponent || g.opponent.id !== opponentTeamId) continue;
      if (g.date === today) continue; // frozen at pre-game value, see getBatterSeriesAndStreak
      careerG += 1; careerW += g.stat.wins || 0; careerL += g.stat.losses || 0;
      careerOuts += ipToOuts(g.stat.inningsPitched); careerEr += g.stat.earnedRuns || 0;
      if (yr === 2026) {
        seasonG += 1; seasonW += g.stat.wins || 0; seasonL += g.stat.losses || 0;
        seasonOuts += ipToOuts(g.stat.inningsPitched); seasonEr += g.stat.earnedRuns || 0;
      }
    }
  }
  const eraFrom = (er: number, outs: number) => (outs > 0 ? ((er * 27) / outs).toFixed(2) : "-.--");
  return {
    career: { games: careerG, wins: careerW, losses: careerL, era: eraFrom(careerEr, careerOuts) },
    season: { games: seasonG, wins: seasonW, losses: seasonL, era: eraFrom(seasonEr, seasonOuts) },
  };
}

async function getBatterVsOpponentRecord(personId: number, opponentTeamId: number, seasons: number[], feed: any) {
  const today = todayStr(feed);
  let cG = 0, cAb = 0, cHits = 0, cHr = 0, cRbi = 0, cBb = 0, cHbp = 0, cSf = 0, cTb = 0;
  let sG = 0, sAb = 0, sHits = 0, sHr = 0, sRbi = 0, sBb = 0, sHbp = 0, sSf = 0, sTb = 0;
  for (const yr of seasons) {
    let d;
    try {
      d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=hitting&season=${yr}`);
    } catch { continue; }
    const games = d.stats?.[0]?.splits || [];
    for (const g of games) {
      if (!g.opponent || g.opponent.id !== opponentTeamId) continue;
      if (g.date === today) continue; // frozen at pre-game value, see getBatterSeriesAndStreak
      if ((g.stat.atBats || 0) === 0 && (g.stat.baseOnBalls || 0) === 0) continue; // no PA
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
  function opsFrom(ab: number, hits: number, bb: number, hbp: number, sf: number, tb: number) {
    const obpDenom = ab + bb + hbp + sf;
    const obp = obpDenom > 0 ? (hits + bb + hbp) / obpDenom : 0;
    const slg = ab > 0 ? tb / ab : 0;
    return fmt3(obp + slg);
  }
  return {
    career: { games: cG, avg: avgFrom(cHits, cAb), ops: opsFrom(cAb, cHits, cBb, cHbp, cSf, cTb), hr: cHr, rbi: cRbi },
    season: { games: sG, avg: avgFrom(sHits, sAb), ops: opsFrom(sAb, sHits, sBb, sHbp, sSf, sTb), hr: sHr, rbi: sRbi },
  };
}

function computeAffiliations(
  pitcherHistory: { teamId: number; season: number }[],
  batterHistory: { teamId: number; season: number }[],
  pitcherTeamId: number,
  batterTeamId: number,
) {
  const pitcherPlayedForBatterTeam = [...new Set(pitcherHistory.filter((h) => h.teamId === batterTeamId).map((h) => h.season))].sort();
  const batterPlayedForPitcherTeam = [...new Set(batterHistory.filter((h) => h.teamId === pitcherTeamId).map((h) => h.season))].sort();

  const batterByTeamSeason = new Set(batterHistory.map((h) => `${h.teamId}-${h.season}`));
  const teammateMap = new Map<number, Set<number>>();
  for (const h of pitcherHistory) {
    // only count a shared team as "were teammates" when it's a third team —
    // not either player's current team (that overlap is already covered by
    // pitcherPlayedForBatterTeam / batterPlayedForPitcherTeam above)
    if (h.teamId === pitcherTeamId || h.teamId === batterTeamId) continue;
    if (batterByTeamSeason.has(`${h.teamId}-${h.season}`)) {
      if (!teammateMap.has(h.teamId)) teammateMap.set(h.teamId, new Set());
      teammateMap.get(h.teamId)!.add(h.season);
    }
  }
  const wereTeammates = [...teammateMap.entries()].map(([teamId, seasons]) => ({
    teamId, teamName: koreanNameForMlbTeamId(teamId), seasons: [...seasons].sort(),
  }));

  return { pitcherPlayedForBatterTeam, batterPlayedForPitcherTeam, wereTeammates };
}

async function getPersonBioInfo(personId: number) {
  const d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}`);
  const p = d.people?.[0];
  if (!p) return null;
  let school: string | null = null;
  if (p.draftYear) {
    try {
      const draftData = await mlbGet(`https://statsapi.mlb.com/api/v1/draft/${p.draftYear}?playerId=${personId}`);
      for (const r of draftData.drafts?.rounds || []) {
        const pick = (r.picks || []).find((pk: any) => String(pk.person?.id) === String(personId));
        if (pick?.school?.name) { school = pick.school.name; break; }
      }
    } catch { /* skip */ }
  }
  return {
    birthDate: p.birthDate as string | undefined,
    birthCity: p.birthCity as string | undefined,
    birthCountry: p.birthCountry as string | undefined,
    school,
  };
}

function isHighSchoolName(name: string): boolean {
  return /\bhs\b/i.test(name) || /high school/i.test(name);
}

// Same-team-ever is already covered by `affiliations`; this adds the connections that
// aren't tied to team rosters — shared school and shared hometown — plus each player's
// own birthday, all surfaced as news-ticker facts rather than a persistent info box
// since they're "neat trivia," not something worth staring at all game.
function getSharedConnectionFacts(
  pitcherBio: Awaited<ReturnType<typeof getPersonBioInfo>>,
  batterBio: Awaited<ReturnType<typeof getPersonBioInfo>>,
): string[] {
  if (!pitcherBio || !batterBio) return [];
  const facts: string[] = [];

  if (pitcherBio.school && batterBio.school && pitcherBio.school === batterBio.school) {
    const kind = isHighSchoolName(pitcherBio.school) ? "고등학교" : "대학교";
    facts.push(`두 선수 모두 ${pitcherBio.school} 출신 (같은 ${kind})`);
  }

  if (pitcherBio.birthCity && batterBio.birthCity && pitcherBio.birthCity === batterBio.birthCity) {
    const country = pitcherBio.birthCountry && pitcherBio.birthCountry === batterBio.birthCountry ? `, ${pitcherBio.birthCountry}` : "";
    facts.push(`두 선수 모두 ${pitcherBio.birthCity}${country} 출신 (동향)`);
  }

  return facts;
}

function getBirthdayFact(bio: Awaited<ReturnType<typeof getPersonBioInfo>>): string | null {
  if (!bio?.birthDate) return null;
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(bio.birthDate);
  if (!m) return null;
  const todayKst = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
  const [, bm, bd] = m;
  for (const [offset, label] of [[-1, "어제"], [0, "오늘"], [1, "내일"]] as const) {
    const d = new Date(`${todayKst}T00:00:00+09:00`);
    d.setDate(d.getDate() + offset);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    if (mm === bm && dd === bd) return `${label} 생일`;
  }
  return null;
}

const HITTING_MILESTONES: { key: "hr" | "hits" | "sb" | "rbi"; label: string; tiers: number[]; gap: number }[] = [
  { key: "hr", label: "홈런", tiers: [100, 150, 200, 250, 300, 350, 400, 450, 500], gap: 10 },
  { key: "hits", label: "안타", tiers: [500, 1000, 1500, 2000, 2500, 3000], gap: 30 },
  { key: "sb", label: "도루", tiers: [100, 200, 300, 400, 500], gap: 10 },
  { key: "rbi", label: "타점", tiers: [500, 750, 1000, 1250, 1500], gap: 20 },
];
const PITCHING_MILESTONES: { key: "wins" | "so" | "saves"; label: string; tiers: number[]; gap: number }[] = [
  { key: "wins", label: "승", tiers: [50, 100, 150, 200], gap: 10 },
  { key: "so", label: "탈삼진", tiers: [500, 1000, 1500, 2000, 2500, 3000], gap: 20 },
  { key: "saves", label: "세이브", tiers: [100, 150, 200, 250, 300, 350, 400], gap: 10 },
];

async function getNotableFacts(personId: number, group: "hitting" | "pitching"): Promise<string[]> {
  const facts: string[] = [];

  // ---- 1) year-by-year: consecutive-season streaks, milestone proximity, career-high-in-progress ----
  const d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=yearByYear&group=${group}`);
  const splits = d.stats?.[0]?.splits || [];
  const bySeason = new Map<number, { hr: number; rbi: number; so: number; wins: number; sb: number; hits: number; saves: number }>();
  for (const s of splits) {
    if (!s.team) continue;
    const season = parseInt(s.season, 10);
    const cur = bySeason.get(season) || { hr: 0, rbi: 0, so: 0, wins: 0, sb: 0, hits: 0, saves: 0 };
    cur.hr += s.stat.homeRuns || 0;
    cur.rbi += s.stat.rbi || 0;
    cur.so += s.stat.strikeOuts || 0;
    cur.wins += s.stat.wins || 0;
    cur.sb += s.stat.stolenBases || 0;
    cur.hits += s.stat.hits || 0;
    cur.saves += s.stat.saves || 0;
    bySeason.set(season, cur);
  }
  const seasons = [...bySeason.keys()].sort((a, b) => b - a);

  function streak(key: "hr" | "rbi" | "so" | "wins" | "sb", threshold: number) {
    let n = 0;
    let prev: number | null = null;
    for (const s of seasons) {
      if (prev !== null && prev - s !== 1) break;
      if (bySeason.get(s)![key] >= threshold) {
        n++;
        prev = s;
      } else break;
    }
    return n;
  }

  if (group === "hitting") {
    const hrStreak = streak("hr", 20);
    if (hrStreak >= 2) facts.push(`${hrStreak}년 연속 20홈런`);
    const rbiStreak = streak("rbi", 100);
    if (rbiStreak >= 2) facts.push(`${rbiStreak}년 연속 100타점`);
    const sbStreak = streak("sb", 20);
    if (sbStreak >= 2) facts.push(`${sbStreak}년 연속 20도루`);
  } else {
    const soStreak = streak("so", 100);
    if (soStreak >= 2) facts.push(`${soStreak}년 연속 100탈삼진`);
    const winStreak = streak("wins", 15);
    if (winStreak >= 2) facts.push(`${winStreak}년 연속 15승`);
  }

  // career totals (all seasons summed) for milestone-proximity checks
  const career = { hr: 0, rbi: 0, sb: 0, hits: 0, wins: 0, so: 0, saves: 0 };
  for (const s of seasons) {
    const v = bySeason.get(s)!;
    career.hr += v.hr; career.rbi += v.rbi; career.sb += v.sb; career.hits += v.hits;
    career.wins += v.wins; career.so += v.so; career.saves += v.saves;
  }
  const milestones = group === "hitting" ? HITTING_MILESTONES : PITCHING_MILESTONES;
  for (const m of milestones) {
    const current = career[m.key];
    const nextTier = m.tiers.find((t) => t > current);
    if (nextTier && nextTier - current <= m.gap) {
      facts.push(`통산 ${nextTier}${m.label}까지 ${nextTier - current}개`);
    }
  }

  // career-high-in-progress: is the current (2026) season total already above every prior season?
  const priorSeasons = seasons.filter((s) => s !== 2026);
  if (bySeason.has(2026) && priorSeasons.length > 0) {
    const cur2026 = bySeason.get(2026)!;
    const checkKeys = group === "hitting" ? (["hr", "rbi", "sb"] as const) : (["wins", "so", "saves"] as const);
    const labels: Record<string, string> = { hr: "홈런", rbi: "타점", sb: "도루", wins: "승", so: "탈삼진", saves: "세이브" };
    for (const key of checkKeys) {
      const priorMax = Math.max(...priorSeasons.map((s) => bySeason.get(s)![key]));
      const cur = cur2026[key];
      if (cur > priorMax && cur >= 10) {
        facts.push(`이번 시즌 ${labels[key]} ${cur}개, 커리어 최다 경신 중`);
      }
    }
  }

  // ---- 2) this-season gameLog: on-base streak (hitting) / scoreless-innings streak (pitching) ----
  try {
    const glData = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=${group}&season=2026`);
    const games = (glData.stats?.[0]?.splits || []).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

    if (group === "hitting") {
      let n = 0;
      for (const g of games) {
        if ((g.stat.atBats || 0) === 0 && (g.stat.baseOnBalls || 0) === 0 && (g.stat.hitByPitch || 0) === 0) continue;
        const reachedBase = (g.stat.hits || 0) > 0 || (g.stat.baseOnBalls || 0) > 0 || (g.stat.hitByPitch || 0) > 0;
        if (reachedBase) n++;
        else break;
      }
      if (n >= 15) facts.push(`${n}경기 연속 출루`);
    } else {
      let outs = 0;
      for (const g of games) {
        if ((g.stat.earnedRuns || 0) === 0) {
          outs += ipToOuts(g.stat.inningsPitched);
        } else break;
      }
      const ip = outs / 3;
      if (ip >= 15) facts.push(`${ip % 1 === 0 ? ip : ip.toFixed(1)}이닝 연속 무실점`);
    }
  } catch { /* skip */ }

  return facts;
}

async function getCuratedContent(mlbPersonId: number) {
  const { data: player } = await supabase
    .from("players")
    .select("id, name")
    .eq("bio->>mlb_person_id", String(mlbPersonId))
    .maybeSingle();
  if (!player) return null;
  const { data: content } = await supabase
    .from("player_content")
    .select("category, title, body")
    .eq("player_id", player.id)
    .order("created_at", { ascending: false })
    .limit(5);
  return { playerId: player.id, name: player.name, content: content || [] };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const awayTeamId = Number(searchParams.get("awayTeamId"));
  const homeTeamId = Number(searchParams.get("homeTeamId"));
  const overrideGamePk = searchParams.get("gamePk");
  // Manual pitcher/batter override for the "내일의 중계" prep view — a future game has no
  // live at-bat to derive these from, so the client picks them explicitly instead.
  const overridePitcherId = searchParams.get("pitcherId");
  const overridePitcherName = searchParams.get("pitcherName");
  const overridePitcherSide = searchParams.get("pitcherSide") as "home" | "away" | null;
  const overrideBatterId = searchParams.get("batterId");
  const overrideBatterName = searchParams.get("batterName");

  if (!awayTeamId || !homeTeamId) {
    return NextResponse.json({ error: "awayTeamId, homeTeamId required" }, { status: 400 });
  }

  const gamePk = overrideGamePk ? Number(overrideGamePk) : await findTodayGamePk(awayTeamId, homeTeamId);
  if (!gamePk) {
    return NextResponse.json({ status: "no_game" });
  }

  const feed = await mlbGet(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
  const status = feed.gameData?.status?.detailedState || "Unknown";
  const currentPlay = feed.liveData?.plays?.currentPlay;

  // isTopInning true -> away team is batting -> home team is pitching (and vice versa)
  const isTopInning: boolean | undefined = currentPlay?.about?.isTopInning;
  const pitcherSide: "home" | "away" =
    overridePitcherSide ?? (isTopInning === undefined ? "home" : isTopInning ? "home" : "away");
  const batterSide: "home" | "away" = pitcherSide === "home" ? "away" : "home";

  const fallbackPitcher = pitcherSide === "away" ? feed.gameData?.probablePitchers?.away : feed.gameData?.probablePitchers?.home;
  const pitcher = overridePitcherId
    ? { id: Number(overridePitcherId), fullName: overridePitcherName || "" }
    : currentPlay?.matchup?.pitcher || fallbackPitcher || feed.gameData?.probablePitchers?.away || feed.gameData?.probablePitchers?.home;
  const batter = overrideBatterId
    ? { id: Number(overrideBatterId), fullName: overrideBatterName || "" }
    : currentPlay?.matchup?.batter || null;

  // when not in progress, just show away probable pitcher vs home probable pitcher context
  const isLive = status === "In Progress";

  const gameStarted = ["In Progress", "Manager Challenge", "Game Over", "Final", "Suspended", "Delayed"].includes(status);
  const oaaMap = gameStarted ? await getOaaMap().catch(() => new Map<string, number>()) : new Map<string, number>();
  const { recentHomeRuns, defensiveHighlight } = gameStarted
    ? await getGameFeedHighlights(gamePk, oaaMap).catch(() => ({ recentHomeRuns: [], defensiveHighlight: null }))
    : { recentHomeRuns: [], defensiveHighlight: null };

  // current base runners (only present in the feed when someone is actually on) — used
  // to show the lead runner's season SB rate + sprint speed next to the catcher's CS%.
  const offense = feed.liveData?.linescore?.offense;
  const runners = [offense?.first, offense?.second, offense?.third].filter(Boolean) as { id: number; fullName: string }[];
  const sprintSpeedMap = runners.length > 0 ? await getSprintSpeedMap().catch(() => new Map<number, number>()) : new Map<number, number>();
  const runnerInfo = await Promise.all(
    runners.map(async (r) => {
      let sbPct: string | null = null;
      try {
        const d = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${r.id}/stats?stats=season&group=hitting&season=2026`);
        const s = d.stats?.[0]?.splits?.[0]?.stat;
        const todayDelta = getTodaySbDelta(feed, batterSide, r.id, "batting");
        const sb = Math.max(0, (s?.stolenBases ?? 0) - todayDelta.sb);
        const cs = Math.max(0, (s?.caughtStealing ?? 0) - todayDelta.cs);
        const attempts = sb + cs;
        sbPct = attempts > 0 ? `${Math.round((sb / attempts) * 100)}%(${sb}/${attempts})` : null;
      } catch { /* skip */ }
      return { name: r.fullName, sbPct, sprintSpeed: sprintSpeedMap.get(r.id) ?? null };
    }),
  );

  const base: Record<string, unknown> = {
    status,
    isLive,
    inning: currentPlay?.about?.inning ?? null,
    halfInning: currentPlay?.about?.halfInning ?? null,
    outs: currentPlay?.count?.outs ?? null,
    balls: currentPlay?.count?.balls ?? null,
    strikes: currentPlay?.count?.strikes ?? null,
    linescore: feed.liveData?.linescore?.teams ?? null,
    probablePitchers: feed.gameData?.probablePitchers ?? null,
    recentHomeRuns,
    defensiveHighlight,
    runners: runnerInfo,
  };

  if (!pitcher) {
    return NextResponse.json(base);
  }

  const pitcherTeamId = pitcherSide === "home" ? homeTeamId : awayTeamId;
  const batterTeamId = batterSide === "home" ? homeTeamId : awayTeamId;

  const pitcherHistory = await getTeamHistory(pitcher.id, "pitching").catch(() => []);
  const pitcherSeasons = [...new Set(pitcherHistory.map((h) => h.season))];

  const startingPitcherId = feed.gameData?.probablePitchers?.[pitcherSide]?.id;
  const isReliever = startingPitcherId != null && startingPitcherId !== pitcher.id;

  const catcher = getCatcherOnField(feed, pitcherSide);

  // Bases-loaded-only stat is gated on the live base state so the (season + career-loop)
  // fetch only runs on the rare pitches where it's actually relevant.
  const basesLoaded = !!(offense?.first && offense?.second && offense?.third);
  const pitcherTodayDeltas = getTodaySplitDeltas(feed, pitcher.id, "pitching");

  const [handSplits, curated, seasonHighs, vsOpponentTeam, notableFacts, pitchMix, recentBullpenOutings, pitcherBio, pitcherSbDefense, catcherSbDefense, runnerSplits, basesLoadedStat] =
    await Promise.all([
      getHandednessSplits(pitcher.id, "pitching", pitcherTodayDeltas.hand).catch(() => []),
      getCuratedContent(pitcher.id).catch(() => null),
      getPitcherSeasonHighs(pitcher.id, feed).catch(() => null),
      batter ? getPitcherVsOpponentRecord(pitcher.id, batterTeamId, pitcherSeasons, feed).catch(() => null) : Promise.resolve(null),
      getNotableFacts(pitcher.id, "pitching").catch(() => []),
      getPitcherPitchMix(pitcher.id).catch(() => null),
      isReliever ? getRecentBullpenOutings(pitcher.id, feed).catch(() => []) : Promise.resolve([]),
      getPersonBioInfo(pitcher.id).catch(() => null),
      getStolenBaseDefense(pitcher.id, "pitching", getTodaySbDelta(feed, pitcherSide, pitcher.id, "pitching")).catch(() => null),
      catcher ? getStolenBaseDefense(catcher.id, "catching", getTodaySbDelta(feed, pitcherSide, catcher.id, "fielding")).catch(() => null) : Promise.resolve(null),
      getRunnerSplits(pitcher.id, "pitching", pitcherTodayDeltas.runner).catch(() => []),
      basesLoaded ? getBasesLoadedStat(pitcher.id, "pitching", pitcherTodayDeltas.loaded).catch(() => null) : Promise.resolve(null),
    ]);

  const todayPitcherLine = getTodayPitcherLine(feed, pitcherSide, pitcher.id);
  const pitcherBirthdayFact = getBirthdayFact(pitcherBio);
  const pitcherNotableFacts = [
    ...notableFacts,
    ...nearSeasonHighFacts(seasonHighs, todayPitcherLine),
    ...(pitcherBirthdayFact ? [pitcherBirthdayFact] : []),
  ];

  const pitcherInfo: Record<string, unknown> = {
    id: pitcher.id, name: pitcher.fullName, side: pitcherSide, handSplits, curated, seasonHighs,
    vsOpponentTeam, opponentTeamName: koreanNameForMlbTeamId(batterTeamId), notableFacts: pitcherNotableFacts, pitchMix,
    recentBullpenOutings, runnerSplits, basesLoadedStat,
    stolenBaseDefense: {
      pitcher: pitcherSbDefense,
      catcher: catcher ? { name: catcher.name, ...catcherSbDefense } : null,
    },
  };

  let batterInfo: Record<string, unknown> | null = null;
  if (batter) {
    const batterHistory = await getTeamHistory(batter.id, "hitting").catch(() => []);
    const batterSeasons = [...new Set(batterHistory.map((h) => h.season))];

    const batterTodayDeltas = getTodaySplitDeltas(feed, batter.id, "hitting");

    const [matchupHistory, seriesAndStreak, pitchCategoryAvg, batterCurated, batterVsOpponentTeam, batterNotableFacts, batterHandSplits, batterBio, batterRunnerSplits, batterBasesLoadedStat] = await Promise.all([
      getMatchupHistory(pitcher.id, batter.id, pitcherTeamId, batterTeamId, feed).catch(() => null),
      getBatterSeriesAndStreak(batter.id, pitcherTeamId, feed).catch(() => null),
      getBatterPitchCategoryAvg(batter.id).catch(() => null),
      getCuratedContent(batter.id).catch(() => null),
      getBatterVsOpponentRecord(batter.id, pitcherTeamId, batterSeasons, feed).catch(() => null),
      getNotableFacts(batter.id, "hitting").catch(() => []),
      getHandednessSplits(batter.id, "hitting", batterTodayDeltas.hand).catch(() => []),
      getPersonBioInfo(batter.id).catch(() => null),
      getRunnerSplits(batter.id, "hitting", batterTodayDeltas.runner).catch(() => []),
      basesLoaded ? getBasesLoadedStat(batter.id, "hitting", batterTodayDeltas.loaded).catch(() => null) : Promise.resolve(null),
    ]);

    const affiliations = computeAffiliations(pitcherHistory, batterHistory, pitcherTeamId, batterTeamId);
    const batterBirthdayFact = getBirthdayFact(batterBio);
    const sharedConnectionFacts = getSharedConnectionFacts(pitcherBio, batterBio);

    batterInfo = {
      id: batter.id, name: batter.fullName, side: batterSide, matchupHistory,
      series: seriesAndStreak?.series ?? null, streak: seriesAndStreak?.streak ?? null,
      onBaseStreak: seriesAndStreak?.onBaseStreak ?? null,
      pitchCategoryAvg, curated: batterCurated, vsOpponentTeam: batterVsOpponentTeam, handSplits: batterHandSplits,
      opponentTeamName: koreanNameForMlbTeamId(pitcherTeamId), affiliations,
      notableFacts: [...batterNotableFacts, ...(batterBirthdayFact ? [batterBirthdayFact] : []), ...sharedConnectionFacts],
      runnerSplits: batterRunnerSplits, basesLoadedStat: batterBasesLoadedStat,
    };
  }

  return NextResponse.json({ ...base, updatedAt: new Date().toISOString(), pitcher: pitcherInfo, batter: batterInfo });
}
