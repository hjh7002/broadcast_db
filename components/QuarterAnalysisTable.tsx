export type QuarterGame = {
  date: string;
  opponent_name: string;
  round: string;
  q: [number, number][]; // [scored, allowed] for Q1..Q4
  ot?: [number, number];
};

function cell(key: React.Key, scored: number, allowed: number) {
  const margin = scored - allowed;
  const color =
    margin > 0
      ? "text-blue-600 dark:text-blue-400"
      : margin < 0
        ? "text-red-500 dark:text-red-400"
        : "text-neutral-500 dark:text-neutral-400";
  return (
    <td key={key} className="px-3 py-2 whitespace-nowrap">
      {scored}-{allowed} <span className={`text-xs ${color}`}>({margin > 0 ? `+${margin}` : margin})</span>
    </td>
  );
}

export default function QuarterAnalysisTable({ games, title }: { games: QuarterGame[]; title?: string }) {
  if (games.length === 0) return null;

  const totals = [0, 1, 2, 3].map((i) => {
    const scored = games.reduce((sum, g) => sum + (g.q[i]?.[0] ?? 0), 0);
    const allowed = games.reduce((sum, g) => sum + (g.q[i]?.[1] ?? 0), 0);
    return [scored, allowed] as [number, number];
  });

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">{title ?? "쿼터별 득점·실점 분석"}</h2>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-medium">경기</th>
              <th className="px-3 py-2 font-medium">Q1</th>
              <th className="px-3 py-2 font-medium">Q2</th>
              <th className="px-3 py-2 font-medium">Q3</th>
              <th className="px-3 py-2 font-medium">Q4</th>
              <th className="px-3 py-2 font-medium">OT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
            {games.map((g, i) => (
              <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{g.opponent_name}</span>
                  <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">{g.date}</span>
                </td>
                {g.q.map((qp, qi) => cell(qi, qp[0], qp[1]))}
                <td className="px-3 py-2 whitespace-nowrap text-neutral-400 dark:text-neutral-500">
                  {g.ot ? `${g.ot[0]}-${g.ot[1]}` : "-"}
                </td>
              </tr>
            ))}
            <tr className="bg-neutral-50 font-medium dark:bg-neutral-900">
              <td className="px-3 py-2">합계</td>
              {totals.map((t, i) => cell(i, t[0], t[1]))}
              <td className="px-3 py-2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
