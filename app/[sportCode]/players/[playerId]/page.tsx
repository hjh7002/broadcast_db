import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportByCode, getPlayer, getStatFields, getTeam, getPlayerContent } from "@/lib/data";
import PlayerContentList from "@/components/PlayerContentList";
import PlayerEditForm from "@/components/PlayerEditForm";
import PlayerTabs from "@/components/PlayerTabs";
import PlayerHeader from "@/components/PlayerHeader";
import PlayerStatSummary from "@/components/PlayerStatSummary";
import PlayerGameLog, { type GameRow } from "@/components/PlayerGameLog";
import PlayerRecentGames, { type RecentGameRow } from "@/components/PlayerRecentGames";
import PlayerTeamSplits from "@/components/PlayerTeamSplits";
import PlayerPitchMix, { type PitchMixRow } from "@/components/PlayerPitchMix";
import PlayerPitchHandChart, { type HandDistributionRow } from "@/components/PlayerPitchHandChart";
import PlayerPitchValueByCategory, { type PitchValueByCategory } from "@/components/PlayerPitchValueByCategory";
import PlayerCareerByYear from "@/components/PlayerCareerByYear";
import PlayerSingleGameHighs, { type HighLine } from "@/components/PlayerSingleGameHighs";
import PlayerSplitsInfo, { type SplitsInfo } from "@/components/PlayerSplitsInfo";
import PlayerProfileList from "@/components/PlayerProfileList";
import PlayerHittingGameLog, { type HittingGameRow } from "@/components/PlayerHittingGameLog";
import PlayerHittingRecentGames, { type HittingRecentGameRow } from "@/components/PlayerHittingRecentGames";
import PlayerHittingSingleGameHighs, { type HittingHighLine } from "@/components/PlayerHittingSingleGameHighs";
import PlayerHittingSplits, { type HittingSplitsInfo, type HittingStreak } from "@/components/PlayerHittingSplits";
import BasketballGameLog, { type BasketballGameRow } from "@/components/BasketballGameLog";
import BasketballSplits, { type BasketballSplitsData } from "@/components/BasketballSplits";
import PlayerStreaks, { type Streak } from "@/components/PlayerStreaks";
import PlayerMemoEditor from "@/components/PlayerMemoEditor";

export const dynamic = "force-dynamic";

// Which stat_fields matter most for a given position, so the Summary row can
// call them out — e.g. a middle blocker's blocking numbers, not their (mostly
// irrelevant) reception numbers. Keyed by the Korean position label as stored
// on `players.position` (volleyball's convention; sports that use different
// position labels just get no highlight, which is a no-op, not a bug).
const POSITION_STAT_HIGHLIGHTS: Record<string, string[]> = {
  "아웃사이드 히터": ["PTS", "ATT_PCT", "SERVE"],
  "아포짓 스파이커": ["PTS", "ATT_PCT", "SERVE"],
  "미들 블로커": ["BLOCK", "ATT_PCT"],
  "리베로": ["DIG", "RECEIVE_PCT"],
  "세터": ["SET"],
};

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ sportCode: string; playerId: string }>;
}) {
  const { sportCode, playerId } = await params;
  const sport = await getSportByCode(sportCode);
  if (!sport) notFound();
  const player = await getPlayer(playerId);
  if (!player || player.sport_id !== sport.id) notFound();

  const [statFields, team, playerContent] = await Promise.all([
    getStatFields(sport.id),
    player.team_id ? getTeam(player.team_id) : Promise.resolve(null),
    getPlayerContent(player.id),
  ]);

  const stats = (player.stats as Record<string, unknown>) ?? {};
  const bio = (player.bio as Record<string, unknown>) ?? {};
  const isPitcher = player.position === "투수";
  // MLB/KBO have pitcher/hitter-specific stat shapes (pitch mix, hit streaks, etc.) —
  // everything else (NBA, 농구 국가대표, ...) just gets the generic stat-field summary,
  // since sport_stat_fields already defines what to show without any baseball assumptions.
  const isBaseball = sport.code === "mlb" || sport.code === "kbo";
  // National-team basketball (men's/women's) shares the 대표팀/소속팀 split and skips
  // the NBA-only advanced SPLITS block — keyed off a prefix so a new "bball_nt_w"
  // (or any future bball_nt_*) sport doesn't need this list touched again.
  const isBasketballNationalTeam = sport.code.startsWith("bball_nt");
  const statHighlightKeys = player.position ? POSITION_STAT_HIGHLIGHTS[player.position] : undefined;
  const teamSplits = stats.teamSplits as ({ team: string } & Record<string, unknown>)[] | undefined;
  const memoEditor = <PlayerMemoEditor playerId={player.id} initialMemo={(bio.memo as string | null) ?? ""} />;

  let statTab: React.ReactNode;
  let gameTab: React.ReactNode;

  // Basketball players don't have enough going on to justify separate 스탯/게임/프로필
  // tabs — Summary + game log both live on one flowing page, and 프로필 collapses
  // into just the freeform note sections (에피소드 etc.) at the bottom, dropping the
  // baseball-specific bio list (투타/드래프트/학교 — already shown, where relevant,
  // in the header).
  if (isBaseball) {
  if (isPitcher) {
    const gameLog = stats.gameLog as GameRow[] | undefined;
    const recentGames = stats.recentGames as RecentGameRow[] | undefined;
    const pitchMix = stats.pitchMix as PitchMixRow[] | undefined;
    const pitchValueByCategory = stats.pitchValueByCategory as PitchValueByCategory | undefined;
    const handDistribution = stats.handDistribution as HandDistributionRow[] | undefined;
    const singleGameHighs = stats.singleGameHighs as { season?: HighLine; career?: HighLine } | undefined;
    const splitsInfo = stats.splitsInfo as SplitsInfo | undefined;
    const careerStats = stats.career as Record<string, unknown> | undefined;

    statTab = (
      <div>
        <div className="flex flex-wrap items-start gap-8">
          <div>
            <p className="mb-4 text-base font-semibold">Summary</p>
            <PlayerStatSummary statFields={statFields} stats={stats} />
            <PlayerCareerByYear statFields={statFields} years={stats.yearByYear as { season: number; team?: string }[] | undefined} career={careerStats} />
          </div>
          <PlayerPitchHandChart data={handDistribution} />
          <PlayerPitchValueByCategory data={pitchValueByCategory} />
        </div>
        <div className="mt-6">
          <PlayerTeamSplits statFields={statFields} splits={teamSplits} />
        </div>
        {memoEditor}
        <div className="mt-8">
          <PlayerRecentGames games={recentGames} />
        </div>
        <div className="mt-8">
          <PlayerSplitsInfo splits={splitsInfo} />
        </div>
        <div className="mt-8">
          <PlayerPitchMix pitches={pitchMix} />
        </div>
        <div className="mt-8">
          <PlayerSingleGameHighs season={singleGameHighs?.season} career={singleGameHighs?.career} />
        </div>
      </div>
    );
    gameTab = <PlayerGameLog games={gameLog} />;
  } else {
    const gameLog = stats.gameLog as HittingGameRow[] | undefined;
    const recentGames = stats.recentGames as HittingRecentGameRow[] | undefined;
    const singleGameHighs = stats.singleGameHighs as { season?: HittingHighLine; career?: HittingHighLine } | undefined;
    const splitsInfo = stats.splitsInfo as HittingSplitsInfo | undefined;
    const hitStreak = stats.hitStreak as HittingStreak | undefined;
    const onBaseStreak = stats.onBaseStreak as HittingStreak | undefined;
    const multiHitStreak = stats.multiHitStreak as HittingStreak | undefined;
    const streakLine = (s: HittingStreak) => `${s.games}경기 ${s.hits}-${s.ab}, ${s.avg} ${s.hr}홈런 2루타 ${s.doubles}개 OPS ${s.ops}`;
    const careerStats = stats.career as Record<string, unknown> | undefined;

    statTab = (
      <div>
        <p className="mb-4 text-base font-semibold">Summary</p>
        <PlayerStatSummary statFields={statFields} stats={stats} />
        <PlayerCareerByYear statFields={statFields} years={stats.yearByYear as { season: number; team?: string }[] | undefined} career={careerStats} />
        <div className="mt-6">
          <PlayerTeamSplits statFields={statFields} splits={teamSplits} />
        </div>
        {(hitStreak || onBaseStreak || multiHitStreak) ? (
          <div className="mt-6 space-y-2">
            {hitStreak && (
              <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">연속안타</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {streakLine(hitStreak)}
                  {onBaseStreak && onBaseStreak.games === hitStreak.games && " (연속출루와 동일)"}
                  {onBaseStreak && onBaseStreak.games > hitStreak.games && ` | 연속출루 ${streakLine(onBaseStreak)}`}
                </p>
              </div>
            )}
            {!hitStreak && onBaseStreak && (
              <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">연속출루</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{streakLine(onBaseStreak)}</p>
              </div>
            )}
            {multiHitStreak && (
              <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">연속 경기 멀티히트</p>
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{streakLine(multiHitStreak)}</p>
              </div>
            )}
          </div>
        ) : null}
        {memoEditor}
        <div className="mt-8">
          <PlayerHittingRecentGames games={recentGames} />
        </div>
        <div className="mt-8">
          <PlayerHittingSplits splits={splitsInfo} />
        </div>
        <div className="mt-8">
          <PlayerHittingSingleGameHighs season={singleGameHighs?.season} career={singleGameHighs?.career} />
        </div>
      </div>
    );
    gameTab = <PlayerHittingGameLog games={gameLog} />;
  }
  }

  const profileTab = <PlayerProfileList bio={bio} />;

  const header = (
    <>
      <Link
        href={team ? `/${sport.code}/teams/${team.id}` : `/${sport.code}`}
        className="text-sm text-neutral-500 hover:underline dark:text-neutral-400"
      >
        ← {team?.name ?? sport.name}
      </Link>

      <PlayerHeader
        name={player.name}
        jerseyNumber={player.jersey_number}
        position={player.position}
        teamName={team?.name ?? null}
        bio={bio}
      />

      <div className="mb-4">
        <PlayerEditForm player={player} isBaseball={isBaseball} />
      </div>
    </>
  );

  // Basketball: no tab switcher — Summary, game log, and notes all flow on one
  // page (too little content per player to justify separate 스탯/게임/프로필 tabs).
  if (!isBaseball) {
    return (
      <div>
        {header}
        <PlayerStreaks streaks={stats.STREAKS as Streak[] | undefined} />
        <p className="mb-4 text-base font-semibold">Summary</p>
        <PlayerStatSummary statFields={statFields} stats={stats} decimals={1} highlightKeys={statHighlightKeys} />
        {isBasketballNationalTeam ? (
          <>
            <PlayerCareerByYear
              statFields={statFields}
              years={stats.NATIONAL_TEAM_BY_YEAR as { season: number; team?: string }[] | undefined}
              career={stats.NATIONAL_TEAM_CAREER as Record<string, unknown> | undefined}
              label="대표팀 연도별 기록"
              totalLabel="대표팀 통산"
            />
            <PlayerCareerByYear
              statFields={statFields}
              years={stats.CLUB_BY_YEAR as { season: number; team?: string }[] | undefined}
              career={stats.CLUB_CAREER as Record<string, unknown> | undefined}
              label="소속팀 연도별 기록"
              totalLabel="소속팀 통산"
            />
          </>
        ) : (
          <PlayerCareerByYear
            statFields={statFields}
            years={stats.SEASON_HISTORY as { season: number; team?: string }[] | undefined}
            career={stats.CAREER_TOTALS as Record<string, unknown> | undefined}
            label="연도별 기록"
            totalLabel="통산"
          />
        )}
        <div className="mt-8">
          <BasketballGameLog games={stats.GAME_LOG as BasketballGameRow[] | undefined} />
        </div>
        {!isBasketballNationalTeam && (
          <div className="mt-8">
            <BasketballSplits splits={stats.SPLITS as BasketballSplitsData | undefined} />
          </div>
        )}
        <PlayerContentList content={playerContent} />
        <PlayerMemoEditor playerId={player.id} initialMemo={(bio.memo as string | null) ?? ""} />
      </div>
    );
  }

  return (
    <div>
      {header}
      <PlayerTabs statTab={statTab} gameTab={gameTab} profileTab={profileTab} />
    </div>
  );
}
