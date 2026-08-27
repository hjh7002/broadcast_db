import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportByCode, getPlayer, getStatFields, getPlayerContent, getTeam } from "@/lib/data";
import type { PlayerContent } from "@/lib/supabase/types";
import PlayerEditForm from "@/components/PlayerEditForm";
import PlayerContentSection from "@/components/PlayerContentSection";
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
import PlayerMemoEditor from "@/components/PlayerMemoEditor";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  episode: "에피소드",
  background: "선수 정보",
  stat_record: "기록의 의미",
};

// Order here controls section order on the page — change this array to
// rearrange or add a new category, no schema change needed.
const CATEGORY_ORDER = ["episode", "background", "stat_record"];

function groupByCategory(content: PlayerContent[]) {
  const groups = new Map<string, PlayerContent[]>();
  for (const item of content) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return groups;
}

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

  const [statFields, content, team] = await Promise.all([
    getStatFields(sport.id),
    getPlayerContent(playerId),
    player.team_id ? getTeam(player.team_id) : Promise.resolve(null),
  ]);

  const stats = (player.stats as Record<string, unknown>) ?? {};
  const bio = (player.bio as Record<string, unknown>) ?? {};
  const isPitcher = player.position === "투수";
  // MLB/KBO have pitcher/hitter-specific stat shapes (pitch mix, hit streaks, etc.) —
  // everything else (NBA, 농구 국가대표, ...) just gets the generic stat-field summary,
  // since sport_stat_fields already defines what to show without any baseball assumptions.
  const isBaseball = sport.code === "mlb" || sport.code === "kbo";
  const teamSplits = stats.teamSplits as ({ team: string } & Record<string, unknown>)[] | undefined;

  const grouped = groupByCategory(content);
  const orderedCategories = [
    ...CATEGORY_ORDER,
    ...[...grouped.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
  ];

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

  const noteSections = (
    <>
      {orderedCategories.map((category) => (
        <section key={category} className="mt-8">
          <h2 className="mb-3 text-lg font-medium">{CATEGORY_LABELS[category] ?? category}</h2>
          <PlayerContentSection playerId={player.id} category={category} items={grouped.get(category) ?? []} />
        </section>
      ))}
    </>
  );

  const profileTab = (
    <div>
      <PlayerProfileList bio={bio} />
      {noteSections}
    </div>
  );

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
        <PlayerEditForm player={player} />
      </div>
    </>
  );

  // Basketball: no tab switcher — Summary, game log, and notes all flow on one
  // page (too little content per player to justify separate 스탯/게임/프로필 tabs).
  if (!isBaseball) {
    return (
      <div>
        {header}
        <p className="mb-4 text-base font-semibold">Summary</p>
        <PlayerStatSummary statFields={statFields} stats={stats} decimals={1} />
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
        <div className="mt-8">
          <BasketballGameLog games={stats.GAME_LOG as BasketballGameRow[] | undefined} />
        </div>
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
