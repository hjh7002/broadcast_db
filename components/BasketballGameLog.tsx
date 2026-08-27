export type BasketballGameRow = {
  opp: string;
  home?: boolean; // omitted (international/neutral-site games) defaults to "vs" like before
  date: string;
  rd?: string;
  MIN: number | null;
  PTS: number;
  FGM: number;
  FGA: number;
  FGP: number | null;
  P2M: number;
  P2A: number;
  P2P: number | null;
  P3M: number;
  P3A: number;
  P3P: number | null;
  FTM: number;
  FTA: number;
  FTP: number | null;
  OREB: number | null;
  DREB: number | null;
  REB: number;
  AST: number;
  PF: number;
  TO: number;
  STL: number;
  BLK: number;
  PM: number | null;
  EFF: number;
};

// Single-game box score counting stats (MIN/PTS/REB/...) are whole numbers,
// so no decimal formatting — only shooting percentages get 1 decimal place.
function n0(v: number | null | undefined) {
  return typeof v === "number" ? String(v) : "-";
}
function pct1(v: number | null | undefined) {
  return typeof v === "number" ? v.toFixed(1) : "-";
}

function shot(made: number, att: number, pct: number | null) {
  if (att === 0) return "0/0";
  return `${made}/${att} (${pct1(pct)}%)`;
}

export default function BasketballGameLog({ games }: { games: BasketballGameRow[] | undefined }) {
  if (!games || games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">아직 경기별 기록이 없어요.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium">경기</th>
            <th className="px-3 py-2 font-medium">MIN</th>
            <th className="px-3 py-2 font-medium">PTS</th>
            <th className="px-3 py-2 font-medium">FG</th>
            <th className="px-3 py-2 font-medium">2PT</th>
            <th className="px-3 py-2 font-medium">3PT</th>
            <th className="px-3 py-2 font-medium">FT</th>
            <th className="px-3 py-2 font-medium">OREB</th>
            <th className="px-3 py-2 font-medium">DREB</th>
            <th className="px-3 py-2 font-medium">REB</th>
            <th className="px-3 py-2 font-medium">AST</th>
            <th className="px-3 py-2 font-medium">PF</th>
            <th className="px-3 py-2 font-medium">TO</th>
            <th className="px-3 py-2 font-medium">STL</th>
            <th className="px-3 py-2 font-medium">BLK</th>
            <th className="px-3 py-2 font-medium">+/-</th>
            <th className="px-3 py-2 font-medium">EFF</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
          {games.map((g, i) => (
            <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <td className="px-3 py-2 whitespace-nowrap">
                {g.home === false ? "@" : "vs"} {g.opp}
                <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">{g.date}</span>
                {g.rd === "평가전" && (
                  <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    평가전
                  </span>
                )}
              </td>
              <td className="px-3 py-2">{n0(g.MIN)}</td>
              <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">{n0(g.PTS)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{shot(g.FGM, g.FGA, g.FGP)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{shot(g.P2M, g.P2A, g.P2P)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{shot(g.P3M, g.P3A, g.P3P)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{shot(g.FTM, g.FTA, g.FTP)}</td>
              <td className="px-3 py-2">{n0(g.OREB)}</td>
              <td className="px-3 py-2">{n0(g.DREB)}</td>
              <td className="px-3 py-2">{n0(g.REB)}</td>
              <td className="px-3 py-2">{n0(g.AST)}</td>
              <td className="px-3 py-2">{n0(g.PF)}</td>
              <td className="px-3 py-2">{n0(g.TO)}</td>
              <td className="px-3 py-2">{n0(g.STL)}</td>
              <td className="px-3 py-2">{n0(g.BLK)}</td>
              <td className="px-3 py-2">{g.PM == null ? "-" : g.PM > 0 ? `+${g.PM}` : g.PM}</td>
              <td className="px-3 py-2">{n0(g.EFF)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
