import BroadcastForm from "@/components/BroadcastForm";
import BroadcastDisplay from "@/components/BroadcastDisplay";
import ReactivateBroadcastButton from "@/components/ReactivateBroadcastButton";
import { getSports, getAllTeams, getLatestBroadcast, getEndedBroadcasts, getRoster } from "@/lib/data";
import { mlbTeamIdForName } from "@/lib/mlbTeams";
import { getLineupInfo } from "@/lib/liveLineup";
import { getStandingsLine, getSeriesHistory } from "@/lib/teamContext";
import { getTop10Badges, type LeaderBadge } from "@/lib/leaders";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const [sports, teams, broadcast, endedBroadcasts] = await Promise.all([
    getSports(),
    getAllTeams(),
    getLatestBroadcast(),
    getEndedBroadcasts(),
  ]);

  const sport = broadcast ? sports.find((s) => s.id === broadcast.sport_id) : null;
  const homeTeam = broadcast ? teams.find((t) => t.id === broadcast.home_team_id) : null;
  const awayTeam = broadcast ? teams.find((t) => t.id === broadcast.away_team_id) : null;
  const hasActiveBroadcast = Boolean(broadcast && sport && homeTeam && awayTeam);

  const [homeRoster, awayRoster] =
    homeTeam && awayTeam ? await Promise.all([getRoster(homeTeam.id), getRoster(awayTeam.id)]) : [[], []];

  const awayMlbId = awayTeam ? mlbTeamIdForName(awayTeam.name) : null;
  const homeMlbId = homeTeam ? mlbTeamIdForName(homeTeam.name) : null;
  const isMlb = sport?.code === "mlb" && awayMlbId && homeMlbId;
  const [lineupInfo, awayStandings, homeStandings, awaySeries, homeSeries, leaderBadges] = isMlb
    ? await Promise.all([
        getLineupInfo(awayMlbId!, homeMlbId!),
        getStandingsLine(awayMlbId!),
        getStandingsLine(homeMlbId!),
        getSeriesHistory(awayMlbId!),
        getSeriesHistory(homeMlbId!),
        getTop10Badges(),
      ])
    : [null, null, null, null, null, new Map<number, LeaderBadge[]>()];

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">오늘의 중계</h1>

      {hasActiveBroadcast && broadcast && sport && homeTeam && awayTeam ? (
        <BroadcastDisplay
          broadcastId={broadcast.id}
          sport={sport}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeRoster={homeRoster}
          awayRoster={awayRoster}
          homeNote={broadcast.home_note}
          awayNote={broadcast.away_note}
          lineupInfo={lineupInfo}
          awayTeamContext={awayStandings ? { standings: awayStandings, series: awaySeries } : null}
          homeTeamContext={homeStandings ? { standings: homeStandings, series: homeSeries } : null}
          leaderBadges={leaderBadges}
        />
      ) : (
        <>
          <p className="mb-6 text-neutral-500 dark:text-neutral-400">
            새로 오늘 중계할 두 팀을 선택해주세요.
          </p>
          <BroadcastForm sports={sports} teams={teams} />

          {endedBroadcasts.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                최근 종료한 중계 — 다시 켤 수 있어요
              </h2>
              <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
                {endedBroadcasts.map((b) => {
                  const bSport = sports.find((s) => s.id === b.sport_id);
                  const bHome = teams.find((t) => t.id === b.home_team_id);
                  const bAway = teams.find((t) => t.id === b.away_team_id);
                  return (
                    <li key={b.id} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-neutral-900 dark:text-neutral-100">
                        {bAway?.name ?? "?"} vs {bHome?.name ?? "?"}{" "}
                        <span className="text-neutral-500 dark:text-neutral-400">· {bSport?.name ?? ""}</span>
                      </span>
                      <ReactivateBroadcastButton broadcastId={b.id} />
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
