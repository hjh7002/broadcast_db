import { NextResponse } from "next/server";

async function mlbGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

type GameStat = {
  atBats?: number; hits?: number; homeRuns?: number; doubles?: number; triples?: number;
  rbi?: number; stolenBases?: number; strikeOuts?: number; baseOnBalls?: number;
};

function toGameLine(g: { date: string; stat: GameStat }) {
  const s = g.stat;
  return {
    date: g.date,
    ab: s.atBats || 0,
    hits: s.hits || 0,
    hr: s.homeRuns || 0,
    doubles: s.doubles || 0,
    triples: s.triples || 0,
    rbi: s.rbi || 0,
    sb: s.stolenBases || 0,
    so: s.strikeOuts || 0,
    bb: s.baseOnBalls || 0,
  };
}

// Batter-vs-pitcher career head-to-head via MLB's own vsPlayerTotal split — much
// simpler than reconstructing it from game logs since MLB already tracks this pairing.
async function getVsPitcher(personId: string, opponentPitcherId: string) {
  try {
    const data = await mlbGet(
      `https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=vsPlayerTotal&opposingPlayerId=${opponentPitcherId}&group=hitting&sportId=1`,
    );
    const split = data.stats?.[0]?.splits?.[0];
    if (!split) return { vsPitcher: null, pitcherName: null };
    const s = split.stat;
    return {
      vsPitcher: { games: s.gamesPlayed || 0, ab: s.atBats || 0, hits: s.hits || 0, avg: s.avg, ops: s.ops, hr: s.homeRuns || 0 },
      pitcherName: split.pitcher?.fullName ?? null,
    };
  } catch {
    return { vsPitcher: null, pitcherName: null };
  }
}

// Per-game line for this series (or, if today is game 1 of a new series, the just-
// finished previous series) — same "walk back consecutive same-opponent games" logic
// used for the live-matchup panel's series summary, but keeping each game's own line
// instead of reducing to one total.
async function getSeriesGames(personId: string, opponentTeamId: string | null) {
  try {
    const data = await mlbGet(`https://statsapi.mlb.com/api/v1/people/${personId}/stats?stats=gameLog&group=hitting&season=2026`);
    const games = (data.stats?.[0]?.splits || []).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));
    const today = todayStr();
    const nonToday = games.filter((g: any) => g.date !== today);

    const targetOpponentId = opponentTeamId ? Number(opponentTeamId) : null;
    let seriesGames: any[] = [];
    let isPrevious = false;
    let opponentName: string | null = null;

    if (targetOpponentId) {
      const now = Date.now();
      seriesGames = nonToday.filter(
        (g: any) => g.opponent?.id === targetOpponentId && (now - new Date(g.date).getTime()) / 86400000 <= 10,
      );
    }

    if (seriesGames.length === 0) {
      const prevOpponentId = nonToday[0]?.opponent?.id ?? null;
      if (prevOpponentId) {
        for (const g of nonToday) {
          if (g.opponent?.id !== prevOpponentId) break;
          seriesGames.push(g);
        }
        isPrevious = true;
        opponentName = nonToday[0]?.opponent?.name ?? null;
      }
    }

    // chronological (game 1 first) — MLB's gameLog comes back newest-first
    const perGame = seriesGames.slice().reverse().map(toGameLine);
    return { games: perGame.length, isPrevious, opponentName, perGame };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");
  const opponentPitcherId = searchParams.get("opponentPitcherId");
  const opponentTeamId = searchParams.get("opponentTeamId");

  if (!personId) {
    return NextResponse.json({ vsPitcher: null, pitcherName: null, series: null });
  }

  const [vsPitcherResult, series] = await Promise.all([
    opponentPitcherId ? getVsPitcher(personId, opponentPitcherId) : Promise.resolve({ vsPitcher: null, pitcherName: null }),
    getSeriesGames(personId, opponentTeamId),
  ]);

  return NextResponse.json({ ...vsPitcherResult, series });
}
