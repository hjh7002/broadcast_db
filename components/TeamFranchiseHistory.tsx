export type FranchiseHistory = {
  // Every Finals appearance year, tagged with the outcome — championships are the
  // subset where won is true, so the two counts/lists shown are both derived from
  // this single source instead of being kept in sync by hand.
  finals: { year: number; won: boolean }[];
};

export default function TeamFranchiseHistory({ history }: { history: FranchiseHistory | undefined }) {
  if (!history || history.finals.length === 0) return null;

  const championships = history.finals.filter((f) => f.won);

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">프랜차이즈 파이널 기록</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">우승 {championships.length}회</p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {championships.map((f) => f.year).join(", ")}
          </p>
        </div>
        <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">파이널 진출 {history.finals.length}회</p>
          <p className="mt-1 text-sm leading-relaxed">
            {history.finals.map((f, i) => (
              <span key={f.year}>
                {i > 0 && ", "}
                <span
                  className={
                    f.won
                      ? "font-semibold text-amber-600 dark:text-amber-400"
                      : "text-neutral-500 dark:text-neutral-400"
                  }
                >
                  {f.year}
                </span>
              </span>
            ))}
          </p>
          <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">굵은 글씨(주황)는 우승한 해</p>
        </div>
      </div>
    </div>
  );
}
