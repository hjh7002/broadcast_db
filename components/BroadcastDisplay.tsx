import Link from "next/link";
import type { Sport, Team, Player } from "@/lib/supabase/types";
import EndBroadcastButton from "@/components/EndBroadcastButton";
import TeamNoteEditor from "@/components/TeamNoteEditor";
import LiveMatchupPanel from "@/components/LiveMatchupPanel";
import { mlbTeamIdForName } from "@/lib/mlbTeams";
import type { LineupInfo, TeamLineupInfo } from "@/lib/liveLineup";
import type { StandingsLine, SeriesSummary } from "@/lib/teamContext";

type TeamContext = { standings: StandingsLine; series: { recentSeries: SeriesSummary[]; upcomingSeries: SeriesSummary[] } | null } | null;

function seriesLabel(s: SeriesSummary) {
  const record = s.completed ? `(${s.wins}-${s.losses})` : "";
  return `${s.isAway ? "@" : ""}${s.opponentShort}${record}`;
}

function TeamContextHeader({ context }: { context: TeamContext }) {
  if (!context) return null;
  const { standings, series } = context;
  return (
    <div className="px-3 pb-3 text-center text-xs text-neutral-500 dark:text-neutral-400">
      <p>
        {standings.wins}승 {standings.losses}패 · 지구 {standings.divisionRank}위({standings.divisionGamesBack === "-" ? "-" : `${standings.divisionGamesBack}게임차`}) ·
        WC {standings.wildCardRank}위({standings.wildCardGamesBack === "-" ? "-" : `${standings.wildCardGamesBack}게임차`})
      </p>
      {series && series.recentSeries.length > 0 && (
        <p className="mt-1">지난 3시리즈 {series.recentSeries.map(seriesLabel).join("-")}</p>
      )}
      {series && series.upcomingSeries.length > 0 && (
        <p className="mt-0.5">다음 3시리즈 {series.upcomingSeries.map(seriesLabel).join("-")}</p>
      )}
    </div>
  );
}

function isPitcher(player: Player): boolean {
  return player.position === "투수";
}

function mlbPersonId(player: Player): number | null {
  const v = (player.bio as Record<string, unknown>)?.mlb_person_id;
  return typeof v === "number" ? v : null;
}

type Streak = { games: number } & Record<string, unknown>;

// Longer of hitStreak/onBaseStreak, whichever is more notable — mirrors the merge
// precedence used elsewhere on the site (연속출루 only called out when it actually
// beats 연속안타). A 1-game "streak" isn't worth a badge, so it's floored at 2.
function streakBadge(player: Player): string | null {
  const stats = (player.stats as Record<string, unknown>) ?? {};
  const hit = stats.hitStreak as Streak | undefined;
  const onBase = stats.onBaseStreak as Streak | undefined;
  if (onBase && (!hit || onBase.games > hit.games)) {
    return onBase.games >= 2 ? `연속출루 ${onBase.games}G` : null;
  }
  if (hit && hit.games >= 2) return `연속안타 ${hit.games}G`;
  return null;
}

function RosterList({
  sportCode,
  players,
  battingOrderOf,
  showStreak,
}: {
  sportCode: string;
  players: Player[];
  battingOrderOf?: (player: Player) => number | null;
  showStreak?: boolean;
}) {
  if (players.length === 0) return null;
  return (
    <ul className="divide-y divide-neutral-100 text-sm dark:divide-neutral-800">
      {players.map((p) => {
        const order = battingOrderOf?.(p) ?? null;
        const streak = showStreak ? streakBadge(p) : null;
        return (
          <li key={p.id}>
            <Link
              href={`/${sportCode}/players/${p.id}`}
              className="flex items-center justify-between px-4 py-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              <span className="text-neutral-900 dark:text-neutral-100">
                {order != null && <span className="mr-1.5 text-xs text-neutral-400 dark:text-neutral-500">{order}번</span>}
                {p.name}
                {streak && <span className="ml-1.5 text-xs text-amber-600 dark:text-amber-400">{streak}</span>}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {p.position ?? ""} {p.jersey_number != null ? `#${p.jersey_number}` : ""}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function groupByLineup(roster: Player[], lineup: TeamLineupInfo | null | undefined) {
  const pitchers = roster.filter(isPitcher);
  const nonPitchers = roster.filter((p) => !isPitcher(p));

  if (!lineup || lineup.startingBatterIds.length === 0) {
    return {
      startingBatters: [] as Player[],
      benchBatters: nonPitchers,
      startingPitcher: null as Player | null,
      benchPitchers: pitchers,
      orderMap: new Map<string, number>(),
    };
  }

  const orderMap = new Map<string, number>();
  const startingBatters: Player[] = [];
  lineup.startingBatterIds.forEach((personId, idx) => {
    const player = nonPitchers.find((p) => mlbPersonId(p) === personId);
    if (player) {
      startingBatters.push(player);
      orderMap.set(player.id, idx + 1);
    }
  });
  const startingIds = new Set(startingBatters.map((p) => p.id));
  const benchBatters = nonPitchers.filter((p) => !startingIds.has(p.id));

  const startingPitcher = lineup.startingPitcherId
    ? pitchers.find((p) => mlbPersonId(p) === lineup.startingPitcherId) ?? null
    : null;
  const benchPitchers = pitchers.filter((p) => p.id !== startingPitcher?.id);

  return { startingBatters, benchBatters, startingPitcher, benchPitchers, orderMap };
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="bg-neutral-50 px-4 py-1.5 text-xs font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
      {label}
    </div>
  );
}

function TeamColumn({
  broadcastId,
  side,
  sport,
  team,
  roster,
  note,
  lineup,
  gameState,
  teamContext,
}: {
  broadcastId: string;
  side: "home" | "away";
  sport: Sport;
  team: Team;
  roster: Player[];
  note: string | null;
  lineup: TeamLineupInfo | null | undefined;
  gameState: LineupInfo["gameState"] | undefined;
  teamContext: TeamContext;
}) {
  const firstTeam = roster.filter((p) => (p.bio as Record<string, unknown>).roster_level !== "2군");
  const { startingBatters, benchBatters, startingPitcher, benchPitchers, orderMap } = groupByLineup(firstTeam, lineup);
  // Streaks are pregame color only — once the game goes live, today's game itself
  // will start moving them, so the badge is dropped rather than show a stale number.
  const showPregameStreaks = gameState === "Preview";

  return (
    <div className="flex h-[44rem] flex-1 flex-col rounded-lg border border-neutral-200 dark:border-neutral-800">
      <Link
        href={`/${sport.code}/teams/${team.id}`}
        className="block shrink-0 px-4 pt-4 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900"
      >
        <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{team.name}</div>
      </Link>
      <TeamContextHeader context={teamContext} />

      {/* 메모 영역: 카드 높이의 절반 이상을 차지하도록 flex-[3] */}
      <div className="flex-[3] min-h-0">
        <TeamNoteEditor broadcastId={broadcastId} side={side} initialNote={note ?? ""} />
      </div>

      {firstTeam.length > 0 && (
        <div className="flex-[2] min-h-0 overflow-y-auto border-t border-neutral-200 dark:border-neutral-800">
          {startingBatters.length > 0 && (
            <>
              <SectionHeader label={`선발 타자 (${startingBatters.length})`} />
              <RosterList
                sportCode={sport.code}
                players={startingBatters}
                battingOrderOf={(p) => orderMap.get(p.id) ?? null}
                showStreak={showPregameStreaks}
              />
            </>
          )}
          {benchBatters.length > 0 && (
            <>
              <SectionHeader label={`벤치 타자 (${benchBatters.length})`} />
              <RosterList sportCode={sport.code} players={benchBatters} />
            </>
          )}
          {startingPitcher && (
            <>
              <SectionHeader label="선발 투수" />
              <RosterList sportCode={sport.code} players={[startingPitcher]} />
            </>
          )}
          {benchPitchers.length > 0 && (
            <>
              <SectionHeader label={`벤치 투수 (${benchPitchers.length})`} />
              <RosterList sportCode={sport.code} players={benchPitchers} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function BroadcastDisplay({
  broadcastId,
  sport,
  homeTeam,
  awayTeam,
  homeRoster,
  awayRoster,
  homeNote,
  awayNote,
  lineupInfo,
  awayTeamContext,
  homeTeamContext,
}: {
  broadcastId: string;
  sport: Sport;
  homeTeam: Team;
  awayTeam: Team;
  homeRoster: Player[];
  awayRoster: Player[];
  homeNote?: string | null;
  awayNote?: string | null;
  lineupInfo?: LineupInfo | null;
  awayTeamContext?: TeamContext;
  homeTeamContext?: TeamContext;
}) {
  const awayMlbId = mlbTeamIdForName(awayTeam.name);
  const homeMlbId = mlbTeamIdForName(homeTeam.name);

  return (
    <div className="relative rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
      <EndBroadcastButton broadcastId={broadcastId} />
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        오늘의 중계 · {sport.name}
      </p>
      {/* 원정팀(away) 좌측, 홈팀(home) 우측 */}
      <div className="flex items-start justify-center gap-6">
        <TeamColumn
          broadcastId={broadcastId}
          side="away"
          sport={sport}
          team={awayTeam}
          roster={awayRoster}
          note={awayNote ?? null}
          lineup={lineupInfo?.away}
          gameState={lineupInfo?.gameState}
          teamContext={awayTeamContext ?? null}
        />
        <div className="pt-6 text-xl font-bold text-neutral-300 dark:text-neutral-600">VS</div>
        <TeamColumn
          broadcastId={broadcastId}
          side="home"
          sport={sport}
          team={homeTeam}
          roster={homeRoster}
          note={homeNote ?? null}
          lineup={lineupInfo?.home}
          gameState={lineupInfo?.gameState}
          teamContext={homeTeamContext ?? null}
        />
      </div>

      {sport.code === "mlb" && awayMlbId && homeMlbId && (
        <div className="mt-6">
          <LiveMatchupPanel awayTeamMlbId={awayMlbId} homeTeamMlbId={homeMlbId} />
        </div>
      )}
    </div>
  );
}
