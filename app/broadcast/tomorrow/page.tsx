import BroadcastDisplay from "@/components/BroadcastDisplay";
import TomorrowGameList from "@/components/TomorrowGameList";
import { getSportByCode, ensureTeam, getTeam, getRoster } from "@/lib/data";
import { getTomorrowMlbGames } from "@/lib/todaySchedule";
import { mlbTeamIdForName, shortNameForMlbTeamId } from "@/lib/mlbTeams";
import { getStandingsLine, getSeriesHistory } from "@/lib/teamContext";
import { getTop10Badges } from "@/lib/leaders";
import type { PreviewRosterOption } from "@/components/LiveMatchupPanel";

export const dynamic = "force-dynamic";

export default async function TomorrowBroadcastPage({
  searchParams,
}: {
  searchParams: Promise<{
    awayName?: string;
    homeName?: string;
    gamePk?: string;
    awayPitcherId?: string;
    awayPitcherName?: string;
    homePitcherId?: string;
    homePitcherName?: string;
  }>;
}) {
  const sp = await searchParams;
  const sport = await getSportByCode("mlb");
  if (!sport) return <p className="text-neutral-500 dark:text-neutral-400">MLB 종목을 찾지 못했어요.</p>;

  if (!sp.awayName || !sp.homeName) {
    const games = await getTomorrowMlbGames();
    return (
      <div>
        <h1 className="mb-1 text-2xl font-semibold">내일의 중계</h1>
        <p className="mb-6 text-neutral-500 dark:text-neutral-400">
          내일 선발이 예고된 경기를 미리 살펴볼 수 있어요. 라인업은 아직 안 나와서, 투수와 예습할 타자는 직접 골라주세요.
        </p>
        <TomorrowGameList games={games} />
      </div>
    );
  }

  function shortNameFor(name: string): string | null {
    const id = mlbTeamIdForName(name);
    return id ? shortNameForMlbTeamId(id) : null;
  }

  const [homeTeamId, awayTeamId] = await Promise.all([
    ensureTeam(sport.id, sp.homeName, shortNameFor(sp.homeName)),
    ensureTeam(sport.id, sp.awayName, shortNameFor(sp.awayName)),
  ]);
  const [homeTeam, awayTeam] = await Promise.all([getTeam(homeTeamId), getTeam(awayTeamId)]);
  if (!homeTeam || !awayTeam) return <p className="text-neutral-500 dark:text-neutral-400">팀 정보를 불러오지 못했어요.</p>;

  const [homeRoster, awayRoster] = await Promise.all([getRoster(homeTeam.id), getRoster(awayTeam.id)]);

  const awayMlbId = mlbTeamIdForName(awayTeam.name);
  const homeMlbId = mlbTeamIdForName(homeTeam.name);
  const [awayStandings, homeStandings, awaySeries, homeSeries, leaderBadges] =
    awayMlbId && homeMlbId
      ? await Promise.all([
          getStandingsLine(awayMlbId),
          getStandingsLine(homeMlbId),
          getSeriesHistory(awayMlbId),
          getSeriesHistory(homeMlbId),
          getTop10Badges(),
        ])
      : [null, null, null, null, new Map<number, string[]>()];

  function toOptions(roster: typeof homeRoster, side: "home" | "away"): PreviewRosterOption[] {
    return roster
      .map((p) => {
        const personId = (p.bio as Record<string, unknown>)?.mlb_person_id;
        if (typeof personId !== "number") return null;
        return { id: personId, name: p.name, side, isPitcher: p.position === "투수" };
      })
      .filter((o): o is PreviewRosterOption => o !== null);
  }
  const previewRoster = [...toOptions(awayRoster, "away"), ...toOptions(homeRoster, "home")];

  const defaultPitcher = sp.awayPitcherId
    ? { id: Number(sp.awayPitcherId), name: sp.awayPitcherName ?? "", side: "away" as const }
    : sp.homePitcherId
      ? { id: Number(sp.homePitcherId), name: sp.homePitcherName ?? "", side: "home" as const }
      : null;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">내일의 중계</h1>
      <BroadcastDisplay
        sport={sport}
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        homeRoster={homeRoster}
        awayRoster={awayRoster}
        headerLabel="내일의 중계"
        previewMatchup={{ previewRoster, defaultPitcher }}
        awayTeamContext={awayStandings ? { standings: awayStandings, series: awaySeries } : null}
        homeTeamContext={homeStandings ? { standings: homeStandings, series: homeSeries } : null}
        leaderBadges={leaderBadges}
      />
    </div>
  );
}
