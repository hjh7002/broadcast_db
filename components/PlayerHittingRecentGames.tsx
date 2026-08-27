export type HittingRecentGameRow = {
  date: string;
  opponentShort: string;
  isHome: boolean;
  ab: number;
  hits: number;
  hr: number;
  rbi: number;
  bb: number;
  so: number;
};

const HEADERS = ["일자", "상대팀", "타수", "안타", "홈런", "타점", "볼넷", "삼진"];

export default function PlayerHittingRecentGames({ games }: { games: HittingRecentGameRow[] | undefined }) {
  if (!games || games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">기록된 경기가 없어요.</p>;
  }

  const recent = games.slice(0, 5);

  return (
    <div>
      <p className="mb-4 text-base font-semibold">최근 5경기 성적</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              {HEADERS.map((h) => (
                <th key={h} className="whitespace-nowrap py-2 pr-4 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((g) => (
              <tr key={g.date} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-4 whitespace-nowrap">{g.date.slice(5).replace("-", "/")}</td>
                <td className="py-2 pr-4">{g.isHome ? "" : "@"}{g.opponentShort}</td>
                <td className="py-2 pr-4">{g.ab}</td>
                <td className="py-2 pr-4">{g.hits}</td>
                <td className="py-2 pr-4">{g.hr}</td>
                <td className="py-2 pr-4">{g.rbi}</td>
                <td className="py-2 pr-4">{g.bb}</td>
                <td className="py-2 pr-4">{g.so}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
