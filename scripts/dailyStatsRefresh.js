// Daily refresh: cheap, no LLM calls — just re-fetches each MLB player's current-season
// stats/splits/streaks from the MLB Stats API and overwrites ONLY the `stats` column.
// `bio` (awards, team history, contract, etc.) is intentionally left untouched since it
// rarely changes and computing it fully is the expensive part.
//
// Usage:  node scripts/dailyStatsRefresh.js
const { buildPitcherData, supaGet: supaGetP, supaPatch: supaPatchP, TEAM_SHORT: TEAM_SHORT_P } = require('./pitcherPipeline.js');
const { buildHitterData, supaGet: supaGetH, supaPatch: supaPatchH } = require('./hitterPipeline.js');

const supaGet = supaGetP || supaGetH;
const MLB_SPORT_ID = '41cb8ee0-2c3e-4f45-a7b9-4d6d45865efe';

// reverse-map team short_name (as stored in the `teams` table) -> MLB numeric team id
const SHORT_TO_MLB_ID = {};
for (const [mlbId, short] of Object.entries(TEAM_SHORT_P)) {
  SHORT_TO_MLB_ID[short] = parseInt(mlbId, 10);
}

// Runs unattended overnight, so a single transient DNS/network blip (has happened
// before — see the 6-team batch failure incident) must not take down the whole run.
// Retry once, and if a team's player list still can't be fetched, skip just that team
// instead of throwing out of main() and silently abandoning every team after it.
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function withRetry(fn, retries = 2, delayMs = 3000) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; if (i < retries) await sleep(delayMs); }
  }
  throw lastErr;
}

// `PATCH {stats: ...}` replaces the whole jsonb column, not just the keys given — so a
// naive overwrite here silently erases every field the (weekly, slower) full refresh
// computes that light mode skips, e.g. singleGameHighs.career or a hitter's
// career.errors. Deep-merging keeps light mode's fresh numbers for anything it DID
// recompute while preserving full-only fields it left out. Arrays (gameLog, etc.) are
// replaced outright rather than merged — a stale entry from an old array has no home
// to merge into.
function isPlainObject(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function deepMergeStats(oldVal, newVal) {
  if (newVal === undefined) return oldVal;
  if (oldVal === undefined) return newVal;
  if (isPlainObject(oldVal) && isPlainObject(newVal)) {
    const merged = { ...oldVal };
    for (const k of Object.keys(newVal)) merged[k] = deepMergeStats(oldVal[k], newVal[k]);
    return merged;
  }
  return newVal;
}

async function main() {
  const teams = await supaGet(`/rest/v1/teams?select=id,name,short_name&sport_id=eq.${MLB_SPORT_ID}`);
  let ok = 0, fail = 0, skip = 0;

  for (const team of teams) {
    const mlbTeamId = SHORT_TO_MLB_ID[team.short_name];
    if (!mlbTeamId) { console.log(`SKIP TEAM (no MLB id mapping) ${team.name} (${team.short_name})`); continue; }

    let players;
    try {
      players = await withRetry(() => supaGet(`/rest/v1/players?select=id,name,position,bio,stats&team_id=eq.${team.id}`));
    } catch (e) {
      console.log(`SKIP TEAM (roster fetch failed after retry) ${team.name} -> ${e.message}`);
      fail += 1;
      continue;
    }
    for (const p of players) {
      const personId = p.bio && p.bio.mlb_person_id;
      if (!personId) { console.log(`SKIP ${team.name} ${p.name} (no mlb_person_id)`); skip += 1; continue; }
      const isPitcher = p.position === '투수';
      try {
        const data = await withRetry(() =>
          isPitcher
            ? buildPitcherData(personId, mlbTeamId, null, { light: true })
            : buildHitterData(personId, mlbTeamId, null, { light: true }),
        );
        if (!data.stats || Object.keys(data.stats).length === 0) {
          console.log(`SKIP ${team.name} ${p.name} (no 2026 stats yet)`);
          skip += 1;
          continue;
        }
        const mergedStats = deepMergeStats(p.stats, data.stats);
        const updated_at = new Date().toISOString();
        const patch = isPitcher
          ? await supaPatchP(`/rest/v1/players?id=eq.${p.id}`, { stats: mergedStats, updated_at })
          : await supaPatchH(`/rest/v1/players?id=eq.${p.id}`, { stats: mergedStats, updated_at });
        console.log(`OK ${isPitcher ? 'P' : 'H'} ${team.name} ${p.name} (${personId}) -> ${patch.status}`);
        ok += 1;
      } catch (e) {
        console.log(`FAIL ${team.name} ${p.name} (${personId}) -> ${e.message}`);
        fail += 1;
      }
    }
  }
  console.log(`=== DONE: ${ok} OK, ${fail} FAIL, ${skip} SKIP ===`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
