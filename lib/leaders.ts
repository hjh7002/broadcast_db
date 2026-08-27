async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

const HITTING_CATEGORIES: { key: string; label: string }[] = [
  { key: "homeRuns", label: "홈런" },
  { key: "battingAverage", label: "타율" },
  { key: "runsBattedIn", label: "타점" },
  { key: "onBasePlusSlugging", label: "OPS" },
  { key: "stolenBases", label: "도루" },
];

const PITCHING_CATEGORIES: { key: string; label: string }[] = [
  { key: "earnedRunAverage", label: "평균자책" },
  { key: "strikeouts", label: "탈삼진" },
  { key: "wins", label: "다승" },
  { key: "saves", label: "세이브" },
];

async function fetchLeaders(categories: { key: string; label: string }[], statGroup: "hitting" | "pitching") {
  const map = new Map<number, string[]>();
  try {
    const keys = categories.map((c) => c.key).join(",");
    const data = await getJson(
      `https://statsapi.mlb.com/api/v1/stats/leaders?leaderCategories=${keys}&statGroup=${statGroup}&season=2026&sportId=1&limit=10`,
    );
    for (const group of data.leagueLeaders || []) {
      const label = categories.find((c) => c.key === group.leaderCategory)?.label ?? group.leaderCategory;
      for (const l of group.leaders || []) {
        if (l.rank > 10 || !l.person?.id) continue;
        const list = map.get(l.person.id) ?? [];
        list.push(`${label} ${l.rank}위(${l.value})`);
        map.set(l.person.id, list);
      }
    }
  } catch {
    /* leave map empty on failure — badges just won't show */
  }
  return map;
}

// personId -> ["홈런 3위", "타점 7위"] for every MLB player currently top-10 in a major
// stat category — used to badge names in the 오늘의/내일의 중계 roster lists.
export async function getTop10Badges(): Promise<Map<number, string[]>> {
  const [hitting, pitching] = await Promise.all([
    fetchLeaders(HITTING_CATEGORIES, "hitting"),
    fetchLeaders(PITCHING_CATEGORIES, "pitching"),
  ]);
  for (const [id, labels] of pitching) {
    hitting.set(id, [...(hitting.get(id) ?? []), ...labels]);
  }
  return hitting;
}
