// Full refresh: recomputes everything (bio + stats), including the slow parts — draft/FA
// info, debut summary, team history, awards + season-by-season title-finish search, and
// career single-game highs. Meant for an occasional/weekly manual run, not daily.
//
// Preserves any bio fields the pipeline itself doesn't produce (e.g. `contract`, which is
// entered manually from Spotrac data) by merging onto the existing bio rather than
// overwriting it wholesale.
//
// Usage:  node scripts/fullProfileRefresh.js
const { buildPitcherData, supaGet: supaGetP, supaPatch: supaPatchP, TEAM_SHORT: TEAM_SHORT_P } = require('./pitcherPipeline.js');
const { buildHitterData, supaGet: supaGetH, supaPatch: supaPatchH } = require('./hitterPipeline.js');

const supaGet = supaGetP || supaGetH;
const MLB_SPORT_ID = '41cb8ee0-2c3e-4f45-a7b9-4d6d45865efe';

const SHORT_TO_MLB_ID = {};
for (const [mlbId, short] of Object.entries(TEAM_SHORT_P)) {
  SHORT_TO_MLB_ID[short] = parseInt(mlbId, 10);
}

// Same resilience concern as dailyStatsRefresh.js — a transient network blip must
// skip one team/player, not silently abandon the rest of an unattended run.
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
async function withRetry(fn, retries = 2, delayMs = 3000) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); } catch (e) { lastErr = e; if (i < retries) await sleep(delayMs); }
  }
  throw lastErr;
}

async function main() {
  const teams = await supaGet(`/rest/v1/teams?select=id,name,short_name&sport_id=eq.${MLB_SPORT_ID}`);
  let ok = 0, fail = 0, skip = 0;

  for (const team of teams) {
    const mlbTeamId = SHORT_TO_MLB_ID[team.short_name];
    if (!mlbTeamId) { console.log(`SKIP TEAM (no MLB id mapping) ${team.name} (${team.short_name})`); continue; }

    let players;
    try {
      players = await withRetry(() => supaGet(`/rest/v1/players?select=id,name,position,bio&team_id=eq.${team.id}`));
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
            ? buildPitcherData(personId, mlbTeamId, null)
            : buildHitterData(personId, mlbTeamId, null),
        );
        if (!data.stats || Object.keys(data.stats).length === 0) {
          console.log(`SKIP ${team.name} ${p.name} (no 2026 stats yet)`);
          skip += 1;
          continue;
        }
        const mergedBio = { ...(p.bio || {}), ...data.bio };
        const updated_at = new Date().toISOString();
        const patch = isPitcher
          ? await supaPatchP(`/rest/v1/players?id=eq.${p.id}`, { bio: mergedBio, stats: data.stats, updated_at })
          : await supaPatchH(`/rest/v1/players?id=eq.${p.id}`, { bio: mergedBio, stats: data.stats, updated_at });
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
