export type PitchValueByCategory = { 패스트볼: number; 브레이킹볼: number; 오프스피드: number };

export default function PlayerPitchValueByCategory({ data }: { data: PitchValueByCategory | undefined }) {
  if (!data) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">구종가치 (Run Value)</p>
      <div className="flex w-fit divide-x divide-neutral-200 overflow-hidden rounded-md bg-neutral-100 dark:divide-neutral-800 dark:bg-neutral-900">
        {(Object.entries(data) as [string, number][]).map(([label, value]) => (
          <div key={label} className="flex flex-col items-center justify-center gap-1 px-3 py-2.5">
            <p className="whitespace-nowrap text-[11px] font-bold text-neutral-500 dark:text-neutral-400">{label}</p>
            <p
              className={`whitespace-nowrap text-base font-semibold ${
                value < 0 ? "text-blue-600 dark:text-blue-400" : value > 0 ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-neutral-100"
              }`}
            >
              {value > 0 ? `+${value}` : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
