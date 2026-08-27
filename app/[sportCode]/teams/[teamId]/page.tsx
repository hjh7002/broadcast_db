import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportByCode, getTeam, getRoster } from "@/lib/data";
import type { Player } from "@/lib/supabase/types";
import { mlbTeamIdForName } from "@/lib/mlbTeams";
import { formatUpdatedAt } from "@/lib/dataFreshness";
import { getCoachingStaff, getInjuredList, type CoachEntry, type InjuredPlayer } from "@/lib/teamRoster";
import BasketballRosterTable from "@/components/BasketballRosterTable";
import BasketballSchedule, { type ScheduleGame } from "@/components/BasketballSchedule";
import TeamMemoEditor from "@/components/TeamMemoEditor";
import TeamNewsSection, { type TeamNewsItem } from "@/components/TeamNewsSection";
import TeamRosterMoves, { type RosterMoves } from "@/components/TeamRosterMoves";
import TeamSeasonTrend, { type SeasonRecord } from "@/components/TeamSeasonTrend";
import TeamFranchiseHistory, { type FranchiseHistory } from "@/components/TeamFranchiseHistory";
import TeamScheduleIntensity, { type ScheduleIntensity } from "@/components/TeamScheduleIntensity";

export const dynamic = "force-dynamic";

function heightFromBio(bio: Record<string, unknown>): string {
  const hw = bio.height_weight;
  if (typeof hw !== "string") return "-";
  return hw.split(",")[0]?.trim() || "-";
}

function bioField(bio: Record<string, unknown>, key: string): string {
  const v = bio[key];
  return typeof v === "string" && v.length > 0 ? v : "-";
}

function isPitcher(player: Player): boolean {
  return player.position === "투수";
}

// 야구(MLB/KBO)는 투수/타자로 스탯 구조 자체가 갈리지만, 농구는 그렇지 않음 —
// 스포츠 코드로 야구식 투수/타자 분리 테이블을 쓸지, 농구식 단일 테이블을 쓸지 결정.
const BASEBALL_SPORT_CODES = new Set(["mlb", "kbo"]);

function BaseballRosterTable({ players, sportCode }: { players: Player[]; sportCode: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium">등번호</th>
            <th className="px-3 py-2 font-medium">이름</th>
            <th className="px-3 py-2 font-medium">포지션</th>
            <th className="px-3 py-2 font-medium">생년월일</th>
            <th className="px-3 py-2 font-medium">신장</th>
            <th className="px-3 py-2 font-medium">투타유형</th>
            <th className="px-3 py-2 font-medium">출신학교</th>
            <th className="px-3 py-2 font-medium">드래프트 정보</th>
            <th className="px-3 py-2 font-medium">스탯 갱신</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
          {players.map((player) => {
            const bio = player.bio as Record<string, unknown>;
            const updated = formatUpdatedAt(player.updated_at);
            return (
              <tr key={player.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="px-3 py-2 text-left text-neutral-500 dark:text-neutral-400">
                  {player.jersey_number != null ? `#${player.jersey_number}` : "-"}
                </td>
                <td className="px-3 py-2 text-left font-medium text-neutral-900 dark:text-neutral-100">
                  <Link href={`/${sportCode}/players/${player.id}`} className="hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-left">{player.position ?? "-"}</td>
                <td className="px-3 py-2 text-left">{bioField(bio, "birthdate")}</td>
                <td className="px-3 py-2 text-left">{heightFromBio(bio)}</td>
                <td className="px-3 py-2 text-left">{bioField(bio, "throws_bats")}</td>
                <td className="px-3 py-2 text-left">{bioField(bio, "school")}</td>
                <td className="px-3 py-2 text-left">{bioField(bio, "draft_info")}</td>
                <td
                  className={`px-3 py-2 text-left ${updated.stale ? "font-medium text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"}`}
                >
                  {updated.text}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RosterGroup({
  players,
  sportCode,
  finalRosterIds,
}: {
  players: Player[];
  sportCode: string;
  finalRosterIds?: string[];
}) {
  if (!BASEBALL_SPORT_CODES.has(sportCode)) {
    return <BasketballRosterTable players={players} sportCode={sportCode} finalRosterIds={finalRosterIds} />;
  }

  const pitchers = players.filter(isPitcher);
  const fielders = players.filter((p) => !isPitcher(p));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">투수 ({pitchers.length})</h3>
        {pitchers.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">해당 선수가 없어요.</p>
        ) : (
          <BaseballRosterTable players={pitchers} sportCode={sportCode} />
        )}
      </div>
      <div>
        <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">야수 ({fielders.length})</h3>
        {fielders.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-neutral-500">해당 선수가 없어요.</p>
        ) : (
          <BaseballRosterTable players={fielders} sportCode={sportCode} />
        )}
      </div>
    </div>
  );
}

function CoachingStaffList({ staff }: { staff: CoachEntry[] }) {
  if (staff.length === 0) return null;
  return (
    <div className="mb-6 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
      {staff.map((c) => (
        <div key={`${c.role}-${c.name}`} className="flex items-center justify-between border-b border-neutral-100 py-1.5 text-sm dark:border-neutral-900">
          <span className="text-neutral-500 dark:text-neutral-400">{c.role}</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {c.name}
            {c.since != null && <span className="ml-1 text-xs font-normal text-neutral-400 dark:text-neutral-500">({c.since}~)</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

function InjuredListTable({ players }: { players: InjuredPlayer[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium">이름</th>
            <th className="px-3 py-2 font-medium">포지션</th>
            <th className="px-3 py-2 font-medium">구분</th>
            <th className="px-3 py-2 font-medium">등재일</th>
            <th className="px-3 py-2 font-medium">부상 부위</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
          {players.map((p) => (
            <tr key={p.name}>
              <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">{p.name}</td>
              <td className="px-3 py-2">{p.position || "-"}</td>
              <td className="px-3 py-2">{p.ilType || "-"}</td>
              <td className="px-3 py-2">{p.ilDate || "-"}</td>
              <td className="px-3 py-2">
                {p.injury ? (
                  <>
                    {p.injuryKo}
                    <span className="text-neutral-400 dark:text-neutral-500"> ({p.injury})</span>
                  </>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InjuredListSection({ players }: { players: InjuredPlayer[] }) {
  if (players.length === 0) return null;
  const pitchers = players.filter((p) => p.position === "P");
  const positionPlayers = players.filter((p) => p.position !== "P");

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">부상자 명단 ({players.length})</h2>
      <div className="space-y-6">
        {pitchers.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">투수 ({pitchers.length})</h3>
            <InjuredListTable players={pitchers} />
          </div>
        )}
        {positionPlayers.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">야수 ({positionPlayers.length})</h3>
            <InjuredListTable players={positionPlayers} />
          </div>
        )}
      </div>
    </div>
  );
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ sportCode: string; teamId: string }>;
}) {
  const { sportCode, teamId } = await params;
  const sport = await getSportByCode(sportCode);
  if (!sport) notFound();
  const team = await getTeam(teamId);
  if (!team || team.sport_id !== sport.id) notFound();
  const roster = await getRoster(teamId);

  const mlbId = sport.code === "mlb" ? mlbTeamIdForName(team.name) : null;
  const [mlbCoachingStaff, injuredList] = mlbId
    ? await Promise.all([getCoachingStaff(mlbId), getInjuredList(mlbId)])
    : [[], []];
  // Non-MLB sports (currently 농구 국가대표) have no live coaching-staff API, so the
  // head coach lives in `teams.extra.coaching_staff` instead — see scripts/patchCoachingStaff.js.
  const extraCoachingStaff = (team.extra as Record<string, unknown>).coaching_staff as CoachEntry[] | undefined;
  const coachingStaff = mlbCoachingStaff.length > 0 ? mlbCoachingStaff : (extraCoachingStaff ?? []);

  const firstTeam = roster.filter((p) => (p.bio as Record<string, unknown>).roster_level !== "2군");
  const secondTeam = roster.filter((p) => (p.bio as Record<string, unknown>).roster_level === "2군");

  return (
    <div>
      <Link href={`/${sport.code}`} className="text-sm text-neutral-500 hover:underline dark:text-neutral-400">
        ← {sport.name} 팀 목록
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-semibold">{team.name}</h1>

      {!BASEBALL_SPORT_CODES.has(sport.code) && (
        <TeamMemoEditor
          teamId={team.id}
          initialMemo={((team.extra as Record<string, unknown>).memo as string | null) ?? ""}
        />
      )}

      <CoachingStaffList staff={coachingStaff} />

      <TeamNewsSection
        teamId={team.id}
        initialNews={((team.extra as Record<string, unknown>).news as TeamNewsItem[] | undefined) ?? []}
      />

      {roster.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">등록된 선수가 없어요.</p>
      ) : (
        <>
          <h2 className="mt-6 mb-3 text-lg font-medium">
            {BASEBALL_SPORT_CODES.has(sport.code) ? "1군 로스터" : "로스터"} ({firstTeam.length})
          </h2>
          {firstTeam.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">등록 선수가 없어요.</p>
          ) : (
            <RosterGroup
              players={firstTeam}
              sportCode={sport.code}
              finalRosterIds={(team.extra as Record<string, unknown>).final_roster_ids as string[] | undefined}
            />
          )}

          {secondTeam.length > 0 && (
            <>
              <h2 className="mt-8 mb-3 text-lg font-medium">2군 ({secondTeam.length})</h2>
              <RosterGroup players={secondTeam} sportCode={sport.code} />
            </>
          )}
        </>
      )}

      <BasketballSchedule games={(team.extra as Record<string, unknown>).schedule as ScheduleGame[] | undefined} />

      <TeamSeasonTrend seasons={(team.extra as Record<string, unknown>).season_trend as SeasonRecord[] | undefined} />

      <TeamFranchiseHistory history={(team.extra as Record<string, unknown>).franchise_history as FranchiseHistory | undefined} />

      <TeamScheduleIntensity data={(team.extra as Record<string, unknown>).schedule_intensity as ScheduleIntensity | undefined} />

      <TeamRosterMoves moves={(team.extra as Record<string, unknown>).roster_moves as RosterMoves | undefined} />

      <InjuredListSection players={injuredList} />
    </div>
  );
}
