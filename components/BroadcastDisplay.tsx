import Link from "next/link";
import type { Sport, Team, Player } from "@/lib/supabase/types";
import EndBroadcastButton from "@/components/EndBroadcastButton";
import TeamNoteEditor from "@/components/TeamNoteEditor";
import LiveMatchupPanel, { type PreviewRosterOption } from "@/components/LiveMatchupPanel";
import type { LeaderBadge } from "@/lib/leaders";
import BasketballBroadcastRoster from "@/components/BasketballBroadcastRoster";

// MLB/KBO get the pitcher/batter lineup treatment below; every other sport
// (NBA, 농구 국가대표, ...) gets a plain position-grouped roster instead —
// mirrors the same split used on the team/player detail pages.
const BASEBALL_SPORT_CODES = new Set(["mlb", "kbo"]);
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
  leaderBadges,
}: {
  sportCode: string;
  players: Player[];
  battingOrderOf?: (player: Player) => number | null;
  showStreak?: boolean;
  leaderBadges?: Map<number, LeaderBadge[]>;
}) {
  if (players.length === 0) return null;
  return (
    <ul className="divide-y divide-neutral-100 text-sm dark:divide-neutral-800">
      {players.map((p) => {
        const order = battingOrderOf?.(p) ?? null;
        const streak = showStreak ? streakBadge(p) : null;
        const personId = mlbPersonId(p);
        const ranks = personId != null ? leaderBadges?.get(personId) : undefined;
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
                {ranks?.map((r, i) => (
                  <span
                    key={i}
                    className={`ml-1.5 text-xs ${r.bad ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"}`}
                  >
                    {r.text}
                  </span>
                ))}
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

type StandingsEntry = { code: string; rank: number; wins: number; losses: number; points: number; name_ko: string };
type ScheduleEntry = {
  opponent_name: string;
  venue?: string;
  status: "finished" | "scheduled";
  date: string;
};

// group_standings is only stored on whichever team row happened to seed it first
// (see GroupStandingsTable) — so look this team up by matching its FIBA code against
// every entry rather than assuming it's on `team` itself. Matching by full country
// name rather than standings' own `name_ko` because "대한민국" (Korea's full name)
// doesn't actually contain "한국" as a substring — the two diverge for Korea specifically.
const CODE_BY_NAME_FRAGMENT: Record<string, string> = {
  대한민국: "KOR",
  레바논: "LBN",
  사우디아라비아: "KSA",
  일본: "JPN",
  중국: "CHN",
  카타르: "QAT",
};

function teamCode(team: Team): string | null {
  const fragment = Object.keys(CODE_BY_NAME_FRAGMENT).find((f) => team.name.includes(f));
  return fragment ? CODE_BY_NAME_FRAGMENT[fragment] : null;
}

function teamRecord(team: Team, standings: StandingsEntry[] | undefined): string | null {
  const code = teamCode(team);
  const entry = standings?.find((s) => s.code === code);
  return entry ? `${entry.wins}승 ${entry.losses}패` : null;
}

function teamCoach(team: Team): string | null {
  const extra = team.extra as Record<string, unknown>;
  const staff = extra.coaching_staff as { name: string; role: string }[] | undefined;
  const head = staff?.find((s) => s.role === "감독") ?? staff?.[0];
  return head?.name ?? null;
}

// Find the venue for the specific game between these two teams by checking each
// team's own schedule for an entry naming the other team — prefers a still-"scheduled"
// entry (i.e. today's/upcoming game) over an already-finished one.
function matchupVenue(homeTeam: Team, awayTeam: Team): string | null {
  const search = (team: Team, opponent: Team) => {
    const schedule = (team.extra as Record<string, unknown>).schedule as ScheduleEntry[] | undefined;
    if (!schedule) return [];
    return schedule.filter((g) => opponent.name.includes(g.opponent_name) && g.venue);
  };
  const candidates = [...search(homeTeam, awayTeam), ...search(awayTeam, homeTeam)];
  const scheduled = candidates.find((g) => g.status === "scheduled");
  return (scheduled ?? candidates[0])?.venue ?? null;
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
  standings,
  opponentCode,
  leaderBadges,
}: {
  broadcastId?: string;
  side: "home" | "away";
  sport: Sport;
  team: Team;
  roster: Player[];
  note: string | null;
  lineup: TeamLineupInfo | null | undefined;
  gameState: LineupInfo["gameState"] | undefined;
  teamContext: TeamContext;
  standings?: StandingsEntry[];
  opponentCode?: string | null;
  leaderBadges?: Map<number, LeaderBadge[]>;
}) {
  const firstTeam = roster.filter((p) => (p.bio as Record<string, unknown>).roster_level !== "2군");
  const isBaseball = BASEBALL_SPORT_CODES.has(sport.code);
  const { startingBatters, benchBatters, startingPitcher, benchPitchers, orderMap } = isBaseball
    ? groupByLineup(firstTeam, lineup)
    : { startingBatters: [], benchBatters: [], startingPitcher: null, benchPitchers: [], orderMap: new Map<string, number>() };
  // Streaks are pregame color only — once the game goes live, today's game itself
  // will start moving them, so the badge is dropped rather than show a stale number.
  const showPregameStreaks = gameState === "Preview";

  // Baseball keeps a fixed-height card with a scrolling roster (rosters run
  // 20-40+ deep with bench/pitchers). Basketball rosters are ~12-24 players and
  // the ask is to see them all at once with no scroll, so the card grows to fit
  // its content instead, and the memo above it is just user-resizable (drag the
  // textarea's own resize handle) rather than flex-sized against a fixed card height.
  return (
    <div
      className={`flex flex-1 flex-col rounded-lg border border-neutral-200 dark:border-neutral-800 ${isBaseball ? "h-[44rem]" : ""}`}
    >
      <Link
        href={`/${sport.code}/teams/${team.id}`}
        className="block shrink-0 px-4 pt-4 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900"
      >
        <div className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{team.name}</div>
      </Link>
      <TeamContextHeader context={teamContext} />
      {!isBaseball && (teamRecord(team, standings) || teamCoach(team)) && (
        <p className="px-3 pb-2 text-center text-xs text-neutral-500 dark:text-neutral-400">
          {[teamRecord(team, standings), teamCoach(team) ? `감독 ${teamCoach(team)}` : null].filter(Boolean).join(" · ")}
        </p>
      )}

      {/* 메모 영역: 야구는 카드 높이의 절반 이상(flex-[3]), 농구는 직접 드래그로 크기 조절 */}
      {/* 예습("내일의 중계") 모드는 broadcastId가 없는 임시 화면이라 저장할 곳이 없는 메모는 생략 */}
      {broadcastId && (
        <div className={isBaseball ? "flex-[3] min-h-0" : "shrink-0"}>
          <TeamNoteEditor broadcastId={broadcastId} side={side} initialNote={note ?? ""} />
        </div>
      )}

      {firstTeam.length > 0 && (
        <div
          className={`border-t border-neutral-200 dark:border-neutral-800 ${isBaseball ? "flex-[2] min-h-0 overflow-y-auto" : ""}`}
        >
          {isBaseball ? (
            <>
              {startingBatters.length > 0 && (
                <>
                  <SectionHeader label={`선발 타자 (${startingBatters.length})`} />
                  <RosterList
                    sportCode={sport.code}
                    players={startingBatters}
                    battingOrderOf={(p) => orderMap.get(p.id) ?? null}
                    showStreak={showPregameStreaks}
                    leaderBadges={leaderBadges}
                  />
                </>
              )}
              {benchBatters.length > 0 && (
                <>
                  <SectionHeader label={`벤치 타자 (${benchBatters.length})`} />
                  <RosterList sportCode={sport.code} players={benchBatters} leaderBadges={leaderBadges} />
                </>
              )}
              {startingPitcher && (
                <>
                  <SectionHeader label="선발 투수" />
                  <RosterList sportCode={sport.code} players={[startingPitcher]} leaderBadges={leaderBadges} />
                </>
              )}
              {benchPitchers.length > 0 && (
                <>
                  <SectionHeader label={`벤치 투수 (${benchPitchers.length})`} />
                  <RosterList sportCode={sport.code} players={benchPitchers} leaderBadges={leaderBadges} />
                </>
              )}
            </>
          ) : (
            <BasketballBroadcastRoster
              sportCode={sport.code}
              players={firstTeam}
              finalRosterIds={(team.extra as Record<string, unknown>).final_roster_ids as string[] | undefined}
              opponentCode={opponentCode ?? null}
            />
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
  headerLabel,
  previewMatchup,
  leaderBadges,
}: {
  broadcastId?: string;
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
  // "내일의 중계" 예습 화면은 header 문구가 다르고("내일의 중계"), 라이브 타석이 없으니
  // 투수/타자를 직접 골라보는 모드로 LiveMatchupPanel을 띄운다.
  headerLabel?: string;
  previewMatchup?: { previewRoster: PreviewRosterOption[]; defaultPitcher: { id: number; name: string; side: "home" | "away" } | null } | null;
  // MLB personId -> ["홈런 3위", ...] — 리그 top10에 든 주요 지표만 이름 옆에 배지로 표시
  leaderBadges?: Map<number, LeaderBadge[]>;
}) {
  const awayMlbId = mlbTeamIdForName(awayTeam.name);
  const homeMlbId = mlbTeamIdForName(homeTeam.name);
  const isBaseball = BASEBALL_SPORT_CODES.has(sport.code);
  const venue = !isBaseball ? matchupVenue(homeTeam, awayTeam) : null;
  const standings =
    ((homeTeam.extra as Record<string, unknown>).group_standings as StandingsEntry[] | undefined) ??
    ((awayTeam.extra as Record<string, unknown>).group_standings as StandingsEntry[] | undefined);

  // Breaks out of the site-wide max-w-7xl content column so the roster tables
  // (11+ stat columns per side) get noticeably more breathing room than other pages.
  return (
    <div className="relative left-1/2 w-screen max-w-[96rem] -translate-x-1/2">
    <div className="relative rounded-xl border border-neutral-200 p-6 dark:border-neutral-800">
      {broadcastId && <EndBroadcastButton broadcastId={broadcastId} />}
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
        {headerLabel ?? "오늘의 중계"} · {sport.name}
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
          standings={standings}
          opponentCode={teamCode(homeTeam)}
          leaderBadges={leaderBadges}
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
          standings={standings}
          opponentCode={teamCode(awayTeam)}
          leaderBadges={leaderBadges}
        />
      </div>

      {sport.code === "mlb" && awayMlbId && homeMlbId && (
        <div className="mt-6">
          {previewMatchup ? (
            <LiveMatchupPanel
              awayTeamMlbId={awayMlbId}
              homeTeamMlbId={homeMlbId}
              previewMode
              previewRoster={previewMatchup.previewRoster}
              defaultPitcher={previewMatchup.defaultPitcher}
            />
          ) : (
            <LiveMatchupPanel awayTeamMlbId={awayMlbId} homeTeamMlbId={homeMlbId} />
          )}
        </div>
      )}

      {venue && (
        <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400">경기 장소: {venue}</p>
      )}
    </div>
    </div>
  );
}
