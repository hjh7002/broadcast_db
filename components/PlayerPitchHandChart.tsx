export type HandDistributionRow = { type: string; typeKo: string; vsL: number; vsR: number };

export default function PlayerPitchHandChart({ data }: { data: HandDistributionRow[] | undefined }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.vsL, d.vsR]));

  return (
    <div className="w-full max-w-sm">
      <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">좌우타자 상대 구종분포</p>
      <div className="mb-2 flex items-center justify-center gap-4 text-[10px] text-neutral-500 dark:text-neutral-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          좌타자
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          우타자
        </span>
      </div>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.type} className="grid grid-cols-[1fr_4.5rem_1fr] items-center gap-2">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400">{d.vsL}%</span>
              <div className="flex h-2.5 w-full justify-end overflow-hidden rounded-l bg-neutral-100 dark:bg-neutral-900">
                <div className="h-full rounded-l bg-blue-500" style={{ width: `${(d.vsL / maxVal) * 100}%` }} />
              </div>
            </div>
            <p className="text-center text-xs font-medium text-neutral-700 dark:text-neutral-300">{d.typeKo}</p>
            <div className="flex items-center gap-1.5">
              <div className="flex h-2.5 w-full overflow-hidden rounded-r bg-neutral-100 dark:bg-neutral-900">
                <div className="h-full rounded-r bg-rose-500" style={{ width: `${(d.vsR / maxVal) * 100}%` }} />
              </div>
              <span className="text-[10px] tabular-nums text-neutral-500 dark:text-neutral-400">{d.vsR}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
