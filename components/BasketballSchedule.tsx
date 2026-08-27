export type ScheduleGame = {
  round: string;
  opponent_code: string;
  opponent_name: string;
  home: boolean;
  date: string;
  venue?: string;
  note?: string;
  status: "finished" | "scheduled";
  score_for?: number;
  score_against?: number;
  result?: "W" | "L";
  best_performer?: string;
  source_url?: string;
};

function GameRow({ g }: { g: ScheduleGame }) {
  const opponentLabel = g.home ? g.opponent_name : `@ ${g.opponent_name}`;
  return (
    <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
      <td className="px-3 py-2 whitespace-nowrap text-neutral-500 dark:text-neutral-400">{g.date}</td>
      <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
        {opponentLabel} <span className="text-xs text-neutral-400 dark:text-neutral-500">{g.opponent_code}</span>
      </td>
      <td className="px-3 py-2">
        {g.status === "finished" ? (
          <span
            className={
              g.result === "W"
                ? "font-semibold text-blue-600 dark:text-blue-400"
                : "font-semibold text-red-500 dark:text-red-400"
            }
          >
            {g.result} {g.score_for}-{g.score_against}
          </span>
        ) : (
          <span className="text-neutral-500 dark:text-neutral-400">예정</span>
        )}
        {g.note && <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">({g.note})</span>}
      </td>
      <td className="px-3 py-2 text-neutral-600 dark:text-neutral-300">{g.best_performer ?? "-"}</td>
      <td className="px-3 py-2">
        {g.source_url && (
          <a
            href={g.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-neutral-400 hover:underline dark:text-neutral-500"
          >
            FIBA
          </a>
        )}
      </td>
    </tr>
  );
}

export default function BasketballSchedule({ games }: { games: ScheduleGame[] | undefined }) {
  if (!games || games.length === 0) return null;
  const rounds = [...new Set(games.map((g) => g.round))];

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">경기 일정 및 결과</h2>
      {rounds.map((round) => (
        <div key={round} className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">{round}</h3>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                <tr>
                  <th className="px-3 py-2 font-medium">날짜</th>
                  <th className="px-3 py-2 font-medium">상대</th>
                  <th className="px-3 py-2 font-medium">결과</th>
                  <th className="px-3 py-2 font-medium">베스트 퍼포머</th>
                  <th className="px-3 py-2 font-medium">출처</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {games.filter((g) => g.round === round).map((g) => (
                  <GameRow key={g.date} g={g} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
