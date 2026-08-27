export type GameRow = {
  date: string;
  opponentId?: number;
  opponentName: string;
  isHome: boolean;
  decision: string;
  score?: string | null;
  era: string;
  ip: string;
  er: number;
  hits: number;
  singles: number;
  doubles: number;
  triples: number;
  hr: number;
  bb: number;
  so: number;
  whip: string;
  hbp: number;
};

function sum(games: GameRow[], key: keyof GameRow) {
  return games.reduce((acc, g) => acc + (Number(g[key]) || 0), 0);
}

function ipSum(games: GameRow[]) {
  let outs = 0;
  for (const g of games) {
    const [whole, frac] = g.ip.split(".");
    outs += parseInt(whole, 10) * 3 + (frac ? parseInt(frac, 10) : 0);
  }
  return `${Math.floor(outs / 3)}.${outs % 3}`;
}

const HEADERS = [
  "날짜", "결과", "상대팀", "점수", "ERA", "이닝", "자책점", "피안타",
  "1B", "2B", "3B", "홈런", "볼넷", "삼진", "WHIP", "HBP",
];

export default function PlayerGameLog({ games }: { games: GameRow[] | undefined }) {
  if (!games || games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">기록된 경기가 없어요.</p>;
  }

  const groups = new Map<string, GameRow[]>();
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
        const monthEra = (() => {
          let outs = 0;
          let er = 0;
          for (const g of monthGames) {
            const [w, f] = g.ip.split(".");
            outs += parseInt(w, 10) * 3 + (f ? parseInt(f, 10) : 0);
            er += g.er;
          }
          return outs > 0 ? ((er * 27) / outs).toFixed(2) : "0.00";
        })();
        const monthWhip = (() => {
          let outs = 0;
          for (const g of monthGames) {
            const [w, f] = g.ip.split(".");
            outs += parseInt(w, 10) * 3 + (f ? parseInt(f, 10) : 0);
          }
          const bbH = sum(monthGames, "bb") + sum(monthGames, "hits");
          return outs > 0 ? (bbH / (outs / 3)).toFixed(2) : "0.00";
        })();

        return (
          <div key={mk}>
            <p className="mb-2 text-xs text-neutral-500 dark:text-neutral-400">
              {year}년 {parseInt(month, 10)}월
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
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
                    <td className="py-2 pr-4" colSpan={3}>
                      {parseInt(month, 10)}월 기록
                    </td>
                    <td className="py-2 pr-4"></td>
                    <td className="py-2 pr-4">{monthEra}</td>
                    <td className="py-2 pr-4">{ipSum(monthGames)}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "er")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "hits")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "singles")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "doubles")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "triples")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "hr")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "bb")}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "so")}</td>
                    <td className="py-2 pr-4">{monthWhip}</td>
                    <td className="py-2 pr-4">{sum(monthGames, "hbp")}</td>
                  </tr>
                  {monthGames.map((g) => (
                    <tr key={g.date} className="border-b border-neutral-100 dark:border-neutral-900">
                      <td className="py-2 pr-4 whitespace-nowrap">{g.date.slice(5).replace("-", "/")}</td>
                      <td className={`py-2 pr-4 font-medium ${g.decision === "승" ? "text-blue-600 dark:text-blue-400" : g.decision === "패" ? "text-red-500" : ""}`}>
                        {g.decision}
                      </td>
                      <td className="py-2 pr-4">{g.opponentName}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{g.score ?? "-"}</td>
                      <td className="py-2 pr-4">{g.era}</td>
                      <td className="py-2 pr-4">{g.ip}</td>
                      <td className="py-2 pr-4">{g.er}</td>
                      <td className="py-2 pr-4">{g.hits}</td>
                      <td className="py-2 pr-4">{g.singles}</td>
                      <td className="py-2 pr-4">{g.doubles}</td>
                      <td className="py-2 pr-4">{g.triples}</td>
                      <td className="py-2 pr-4">{g.hr}</td>
                      <td className="py-2 pr-4">{g.bb}</td>
                      <td className="py-2 pr-4">{g.so}</td>
                      <td className="py-2 pr-4">{g.whip}</td>
                      <td className="py-2 pr-4">{g.hbp}</td>
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
