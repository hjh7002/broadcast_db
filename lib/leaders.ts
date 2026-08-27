async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

export type LeaderBadge = { text: string; bad: boolean };

type Category = { key: string; label: string; bad?: boolean };

// All of these resolve "top 10" in the direction that actually matters for a badge —
// for count stats (strikeouts, losses, HR allowed, ...) the league leaders endpoint's
// natural #1 is already "the most of it," which is exactly what a "bad" badge wants.
const HITTING_CATEGORIES: Category[] = [
  { key: "homeRuns", label: "홈런" },
  { key: "battingAverage", label: "타율" },
  { key: "runsBattedIn", label: "타점" },
  { key: "onBasePlusSlugging", label: "OPS" },
  { key: "stolenBases", label: "도루" },
  { key: "doubles", label: "2루타" },
  { key: "triples", label: "3루타" },
  { key: "extraBaseHits", label: "장타" },
  { key: "sacrificeBunts", label: "SAC" },
  { key: "sacrificeFlies", label: "SF" },
  { key: "strikeouts", label: "삼진", bad: true },
  { key: "caughtStealing", label: "도루실패", bad: true },
];

const PITCHING_CATEGORIES: Category[] = [
  { key: "earnedRunAverage", label: "평균자책" },
  { key: "strikeouts", label: "탈삼진" },
  { key: "wins", label: "다승" },
  { key: "saves", label: "세이브" },
  { key: "inningsPitched", label: "이닝" },
  { key: "groundIntoDoublePlays", label: "GIDP" },
  { key: "strikeoutsPer9Inn", label: "K/9" },
  { key: "strikeoutWalkRatio", label: "K/BB" },
  { key: "caughtStealing", label: "CS" },
  { key: "losses", label: "패", bad: true },
  { key: "homeRuns", label: "피홈런", bad: true },
  { key: "hitBatsman", label: "몸맞는공", bad: true },
  { key: "stolenBases", label: "도루", bad: true },
];

function addBadge(map: Map<number, LeaderBadge[]>, personId: number, badge: LeaderBadge) {
  const list = map.get(personId) ?? [];
  list.push(badge);
  map.set(personId, list);
}

async function fetchLeaders(map: Map<number, LeaderBadge[]>, categories: Category[], statGroup: "hitting" | "pitching") {
  try {
    const keys = categories.map((c) => c.key).join(",");
    const data = await getJson(
      `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${keys}&statGroup=${statGroup}&season=2026&sportId=1&limit=10`,
    );
    for (const group of data.leagueLeaders || []) {
      const cat = categories.find((c) => c.key === group.leaderCategory);
      if (!cat) continue;
      for (const l of group.leaders || []) {
        if (l.rank > 10 || !l.person?.id) continue;
        addBadge(map, l.person.id, { text: `${cat.label} ${l.rank}위(${l.value})`, bad: !!cat.bad });
      }
    }
  } catch {
    /* leave whatever was already collected — one failed category batch shouldn't drop the rest */
  }
}

// BB/9 is a rate stat where the league-leaders endpoint always returns the *best*
// (lowest) 10 regardless of sort params — there's no way to ask it for the worst via
// that endpoint, so this hits the general stats endpoint with an explicit descending
// sort instead, restricted to the same "qualified" pool the leaders endpoint uses.
async function fetchWorstWalksPer9(map: Map<number, LeaderBadge[]>) {
  try {
    const data = await getJson(
      "https://statsapi.mlb.com/api/v1/stats?stats=season&group=pitching&season=2026&sportId=1&sortStat=walksPer9Inn&order=desc&limit=10&playerPool=qualified",
    );
    const splits = data.stats?.[0]?.splits || [];
    splits.forEach((s: any, i: number) => {
      const rank = s.rank ?? i + 1;
      if (rank > 10 || !s.player?.id) return;
      addBadge(map, s.player.id, { text: `BB/9 ${rank}위(${s.stat.walksPer9Inn})`, bad: true });
    });
  } catch {
    /* skip */
  }
}

// 득점권 타율 isn't a leaderCategory at all (it's a situational split, not a season
// total), so it needs the statSplits variant of the general stats endpoint instead.
async function fetchRispAverage(map: Map<number, LeaderBadge[]>) {
  try {
    const data = await getJson(
      "https://statsapi.mlb.com/api/v1/stats?stats=statSplits&sitCodes=risp&group=hitting&season=2026&sportId=1&sortStat=battingAverage&order=desc&limit=10&playerPool=qualified",
    );
    const splits = data.stats?.[0]?.splits || [];
    splits.forEach((s: any, i: number) => {
      const rank = s.rank ?? i + 1;
      if (rank > 10 || !s.player?.id) return;
      addBadge(map, s.player.id, { text: `득점권타율 ${rank}위(${s.stat.avg})`, bad: false });
    });
  } catch {
    /* skip */
  }
}

// personId -> [{text: "홈런 9위(30)", bad: false}, ...] for every MLB player currently
// top-10 (best or, for stats where a lot of it is bad, worst) in a major stat category —
// used to badge names in the 오늘의/내일의 중계 roster lists.
export async function getTop10Badges(): Promise<Map<number, LeaderBadge[]>> {
  const map = new Map<number, LeaderBadge[]>();
  await Promise.all([
    fetchLeaders(map, HITTING_CATEGORIES, "hitting"),
    fetchLeaders(map, PITCHING_CATEGORIES, "pitching"),
    fetchWorstWalksPer9(map),
    fetchRispAverage(map),
  ]);
  return map;
}
