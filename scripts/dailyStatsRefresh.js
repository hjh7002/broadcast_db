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

async function main() {
  const teams = await supaGet(`/rest/v1/teams?select=id,name,short_name&sport_id=eq.${MLB_SPORT_ID}`);
  let ok = 0, fail = 0, skip = 0;

  for (const team of teams) {
    const mlbTeamId = SHORT_TO_MLB_ID[team.short_name];
    if (!mlbTeamId) { console.log(`SKIP TEAM (no MLB id mapping) ${team.name} (${team.short_name})`); continue; }

    const players = await supaGet(`/rest/v1/players?select=id,name,position,bio&team_id=eq.${team.id}`);
    for (const p of players) {
      const personId = p.bio && p.bio.mlb_person_id;
      if (!personId) { console.log(`SKIP ${team.name} ${p.name} (no mlb_person_id)`); skip += 1; continue; }
      const isPitcher = p.position === '투수';
      try {
        const data = isPitcher
          ? await buildPitcherData(personId, mlbTeamId, null, { light: true })
          : await buildHitterData(personId, mlbTeamId, null, { light: true });
        if (!data.stats || Object.keys(data.stats).length === 0) {
          console.log(`SKIP ${team.name} ${p.name} (no 2026 stats yet)`);
          skip += 1;
          continue;
        }
        const updated_at = new Date().toISOString();
        const patch = isPitcher
          ? await supaPatchP(`/rest/v1/players?id=eq.${p.id}`, { stats: data.stats, updated_at })
          : await supaPatchH(`/rest/v1/players?id=eq.${p.id}`, { stats: data.stats, updated_at });
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
