export type RosterMoveEntry = {
  name: string;
  route: string; // "FA 영입" | "트레이드" | "재계약" | "사인&트레이드" | "드래프트" | "투웨이 계약" | "미상" ...
  from_team?: string;
  to_team?: string;
  date?: string;
  amount?: string; // contract terms — only meaningful for FA/재계약/사인&트레이드 moves
};

export type RosterMoves = {
  season: string;
  in: RosterMoveEntry[];
  out: RosterMoveEntry[];
};

function MoveList({ entries, direction }: { entries: RosterMoveEntry[]; direction: "in" | "out" }) {
  const team = direction === "in" ? "from_team" : "to_team";
  return (
    <ul className="divide-y divide-neutral-100 dark:divide-neutral-900">
      {entries.map((e) => (
        <li key={e.name} className="flex items-center justify-between gap-3 py-2 text-sm">
          <div>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{e.name}</span>
            {e[team] && (
              <span className="ml-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                {direction === "in" ? "← " : "→ "}
                {e[team]}
              </span>
            )}
            {e.amount && <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">({e.amount})</span>}
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                direction === "in"
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
              }`}
            >
              {e.route}
            </span>
            {e.date && <span className="text-xs text-neutral-400 dark:text-neutral-500">{e.date}</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function TeamRosterMoves({ moves }: { moves: RosterMoves | undefined }) {
  if (!moves || (moves.in.length === 0 && moves.out.length === 0)) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">{moves.season} 이적 현황</h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-300">IN ({moves.in.length})</h3>
          <MoveList entries={moves.in} direction="in" />
        </div>
        <div>
          <h3 className="mb-1 text-sm font-medium text-neutral-600 dark:text-neutral-300">OUT ({moves.out.length})</h3>
          <MoveList entries={moves.out} direction="out" />
        </div>
      </div>
    </div>
  );
}
