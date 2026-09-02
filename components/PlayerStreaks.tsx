export type Streak = { label: string; games: number };

export default function PlayerStreaks({ streaks }: { streaks: Streak[] | undefined }) {
  if (!streaks || streaks.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {streaks.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 dark:border-blue-900 dark:bg-blue-950/40"
        >
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{s.games}경기 연속</span>
          <span className="text-sm text-blue-600 dark:text-blue-400">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
