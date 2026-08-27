import { shortNameForMlbTeamId } from "./mlbTeams";

export type StandingsLine = {
  wins: number;
  losses: number;
  divisionRank: string;
  divisionGamesBack: string;
  wildCardRank: string;
  wildCardGamesBack: string;
};

export type SeriesSummary = {
  opponentShort: string;
  isAway: boolean;
  wins: number;
  losses: number;
  startDate: string;
  endDate: string;
  completed: boolean;
};

async function mlbGet(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  return res.json();
}

export async function getStandingsLine(teamId: number): Promise<StandingsLine | null> {
  try {
    const data = await mlbGet(
      "https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=2026&standingsTypes=regularSeason",
    );
    for (const rec of data.records || []) {
      for (const t of rec.teamRecords || []) {
        if (t.team?.id === teamId) {
          return {
            wins: t.leagueRecord?.wins ?? 0,
            losses: t.leagueRecord?.losses ?? 0,
            divisionRank: t.divisionRank ?? "-",
            divisionGamesBack: t.divisionGamesBack ?? "-",
            wildCardRank: t.wildCardRank ?? "-",
            wildCardGamesBack: t.wildCardGamesBack ?? "-",
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSeriesHistory(
  teamId: number,
): Promise<{ recentSeries: SeriesSummary[]; upcomingSeries: SeriesSummary[] } | null> {
  try {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 40);
    const end = new Date(today);
    end.setDate(end.getDate() + 25);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const data = await mlbGet(
      `https://statsapi.mlb.com/api/v1/schedule?teamId=${teamId}&startDate=${fmt(start)}&endDate=${fmt(end)}&sportId=1`,
    );
    const games: any[] = [];
    for (const d of data.dates || []) for (const g of d.games || []) games.push(g);
    games.sort((a, b) => (a.officialDate < b.officialDate ? -1 : 1));

    // group consecutive games vs the same opponent (same home/away side) into a "series"
    const series: {
      opponentId: number;
      isAway: boolean;
      games: { date: string; win: boolean | null }[];
    }[] = [];
    for (const g of games) {
      const isHome = g.teams.home.team.id === teamId;
      const oppId = isHome ? g.teams.away.team.id : g.teams.home.team.id;
      const isFinal = g.status?.abstractGameState === "Final";
      const usScore = isHome ? g.teams.home.score : g.teams.away.score;
      const oppScore = isHome ? g.teams.away.score : g.teams.home.score;
      const win = isFinal ? usScore > oppScore : null;

      const last = series[series.length - 1];
      if (last && last.opponentId === oppId && last.isAway === !isHome) {
        last.games.push({ date: g.officialDate, win });
      } else {
        series.push({ opponentId: oppId, isAway: !isHome, games: [{ date: g.officialDate, win }] });
      }
    }

    const todayStr = fmt(today);
    const currentIdx = series.findIndex((s) => s.games.some((g) => g.date === todayStr));

    const toSummary = (s: (typeof series)[number]): SeriesSummary => {
      const wins = s.games.filter((g) => g.win === true).length;
      const losses = s.games.filter((g) => g.win === false).length;
      return {
        opponentShort: shortNameForMlbTeamId(s.opponentId),
        isAway: s.isAway,
        wins,
        losses,
        startDate: s.games[0].date,
        endDate: s.games[s.games.length - 1].date,
        completed: s.games.every((g) => g.win !== null),
      };
    };

    const beforeIdx = currentIdx >= 0 ? currentIdx : series.findIndex((s) => !s.games.every((g) => g.win !== null));
    const cutoff = beforeIdx >= 0 ? beforeIdx : series.length;

    const completedSeries = series.slice(0, cutoff).filter((s) => s.games.every((g) => g.win !== null));
    const recentSeries = completedSeries.slice(-3).map(toSummary);

    const afterStart = currentIdx >= 0 ? currentIdx + 1 : cutoff;
    const upcomingSeries = series.slice(afterStart, afterStart + 3).map(toSummary);

    return { recentSeries, upcomingSeries };
  } catch {
    return null;
  }
}
