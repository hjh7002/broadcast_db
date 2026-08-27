export type HittingGameRow = {
  date: string;
  opponentId?: number;
  opponentName: string;
  isHome: boolean;
  ab: number;
  hits: number;
  doubles: number;
  triples: number;
  hr: number;
  rbi: number;
  r: number;
  bb: number;
  so: number;
  sb: number;
  avg: string;
};

function sum(games: HittingGameRow[], key: keyof HittingGameRow) {
  return games.reduce((acc, g) => acc + (Number(g[key]) || 0), 0);
}
function avgFrom(hits: number, ab: number): string {
  return ab > 0 ? (hits / ab).toFixed(3).replace(/^0/, "") : ".000";
}

const HEADERS = ["날짜", "상대팀", "타수", "안타", "2B", "3B", "홈런", "타점", "득점", "볼넷", "삼진", "도루", "타율"];

export default function PlayerHittingGameLog({ games }: { games: HittingGameRow[] | undefined }) {
  if (!games || games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">기록된 경기가 없어요.</p>;
  }

  const groups = new Map<string, HittingGameRow[]>();
  for (const g of games) {
    const key = g.date.slice(0, 7); // YYYY-MM
    const list = groups.get(key) ?? [];
    list.push(g);
    groups.set(key, list);
  }
  const monthKeys = [...groups.keys()].sort().reverse();

  return (
    <div className="space-y-6">
      {monthKeys.map((mk) => {
        const monthGames = groups.get(mk)!;
        const [year, month] = mk.split("-");
        const monthAb = sum(monthGames, "ab");
        const monthHits = sum(monthGames, "hits");

        return (
          <div key={mk}>
            <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              {year}년 {parseInt(month, 10)}월
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
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
                  <tr className="border-b border-neutral-200 bg-neutral-50 font-medium dark:border-neutral-800 dark:bg-neutral-900">
                    <td className="py-2 pr-4" colSpan={2}>
                      {parseInt(month, 10)}월 기록
                    </td>
                    <td className="py-2 pr-4">{monthAb}</td>
                    <td className="py-2 pr-4">{monthHits}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "doubles")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "triples")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "hr")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "rbi")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "r")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "bb")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "so")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "sb")}</td>
                    <td className="py-2 pr-4">{avgFrom(monthHits, monthAb)}</td>
                  </tr>
                  {monthGames.map((g) => (
                    <tr key={g.date} className="border-b border-neutral-100 dark:border-neutral-900">
                      <td className="py-2 pr-4 whitespace-nowrap">{g.date.slice(5).replace("-", "/")}</td>
                      <td className="py-2 pr-4">{g.opponentName}</td>
                      <td className="py-2 pr-4">{g.ab}</td>
                      <td className="py-2 pr-4">{g.hits}</td>
                      <td className="py-2 pr-4">{g.doubles}</td>
                      <td className="py-2 pr-4">{g.triples}</td>
                      <td className="py-2 pr-4">{g.hr}</td>
                      <td className="py-2 pr-4">{g.rbi}</td>
                      <td className="py-2 pr-4">{g.r}</td>
                      <td className="py-2 pr-4">{g.bb}</td>
                      <td className="py-2 pr-4">{g.so}</td>
                      <td className="py-2 pr-4">{g.sb}</td>
                      <td className="py-2 pr-4">{g.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
