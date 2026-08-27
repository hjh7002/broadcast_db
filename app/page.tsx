import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import TodayGameList from "@/components/TodayGameList";
import { getSports, getAllTeams, getLatestBroadcast } from "@/lib/data";
import { getTodayGames } from "@/lib/todaySchedule";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [{ kstDate, mlb, kbo }, sports, teams, broadcast] = await Promise.all([
    getTodayGames(),
    getSports(),
    getAllTeams(),
    getLatestBroadcast(),
  ]);

  const activeSport = broadcast ? sports.find((s) => s.id === broadcast.sport_id) : null;
  const activeHome = broadcast ? teams.find((t) => t.id === broadcast.home_team_id) : null;
  const activeAway = broadcast ? teams.find((t) => t.id === broadcast.away_team_id) : null;

  return (
    <div>
      <div className="mx-auto mb-10 mt-4 max-w-xl">
        <SearchBox />
      </div>

      {broadcast && activeSport && activeHome && activeAway && (
        <div className="mx-auto mb-8 max-w-xl rounded-xl border border-neutral-200 p-4 text-center dark:border-neutral-800">
          <p className="mb-2 text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">진행 중인 중계</p>
          <p className="mb-3 font-medium text-neutral-900 dark:text-neutral-100">
            {activeAway.name} @ {activeHome.name}
          </p>
          <Link href="/broadcast" className="text-sm text-neutral-900 underline dark:text-neutral-100">
            중계 화면 열기
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-xl">
        <h1 className="mb-1 text-lg font-semibold">오늘의 경기 ({kstDate})</h1>
        <p className="mb-4 text-xs text-neutral-500 dark:text-neutral-400">
          경기를 클릭하면 그 경기로 오늘의 중계가 바로 준비돼요.
        </p>

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">MLB</h2>
          <TodayGameList games={mlb} />
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">KBO</h2>
          <TodayGameList games={kbo} />
        </section>

        <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500">
          목록에 없는 경기는{" "}
          <Link href="/broadcast" className="underline">
            직접 설정하기
          </Link>
          에서 고를 수 있어요.
        </p>
      </div>
    </div>
  );
}
