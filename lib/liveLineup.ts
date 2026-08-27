export type TeamLineupInfo = {
  startingBatterIds: number[]; // in batting-order 1~9
  startingPitcherId: number | null;
};

export type LineupInfo = {
  away: TeamLineupInfo;
  home: TeamLineupInfo;
  // "Preview" = still pregame (lineup posted but first pitch hasn't happened) —
  // once it flips to "Live"/"Final" any pregame-only info should stop showing.
  gameState: "Preview" | "Live" | "Final" | null;
};

async function mlbGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

function kstDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

// MLB's schedule `date` bucket is the US-local date, which for most evening games is
// one calendar day behind the KST date the broadcast is actually watched on — a plain
// `new Date().toISOString()` (UTC) query missed today's game for exactly that window.
// Fetching a wider range and filtering by each game's real `gameDate` in KST is the
// only precise way to find "today's" game from a Korean broadcaster's POV.
async function findTodayGamePk(teamAId: number, teamBId: number): Promise<number | null> {
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

export async function getLineupInfo(awayTeamMlbId: number, homeTeamMlbId: number): Promise<LineupInfo | null> {
  try {
    const gamePk = await findTodayGamePk(awayTeamMlbId, homeTeamMlbId);
    if (!gamePk) return null;

    const feed = await mlbGet(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`);
    const boxscore = feed.liveData?.boxscore?.teams;
    const probable = feed.gameData?.probablePitchers;
    const gameState = feed.gameData?.status?.abstractGameState ?? null;

    return {
      away: {
        startingBatterIds: boxscore?.away?.battingOrder ?? [],
        startingPitcherId: probable?.away?.id ?? null,
      },
      home: {
        startingBatterIds: boxscore?.home?.battingOrder ?? [],
        startingPitcherId: probable?.home?.id ?? null,
      },
      gameState,
    };
  } catch {
    return null;
  }
}
