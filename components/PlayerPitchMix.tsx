export type PitchMixRow = {
  type: string;
  typeKo: string;
  usage: string;
  velo: string;
  ba: string;
  hr?: number;
  whiff?: string;
  putAway?: string;
};

export default function PlayerPitchMix({ pitches }: { pitches: PitchMixRow[] | undefined }) {
  if (!pitches || pitches.length === 0) return null;

  return (
    <div>
      <p className="mb-4 text-base font-semibold">구종 분석</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              <th className="py-2 pr-4 font-normal">구종</th>
              <th className="py-2 pr-4 font-normal">구사비율</th>
              <th className="py-2 pr-4 font-normal">구속</th>
              <th className="py-2 pr-4 font-normal">피안타율</th>
              <th className="py-2 pr-4 font-normal">피홈런</th>
              <th className="py-2 pr-4 font-normal">Whiff%</th>
              <th className="py-2 pr-4 font-normal">PutAway%</th>
            </tr>
          </thead>
          <tbody>
            {pitches.map((p) => (
              <tr key={p.type} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-4 font-medium">{p.typeKo}</td>
                <td className="py-2 pr-4">{p.usage}</td>
                <td className="py-2 pr-4">{p.velo}</td>
                <td className="py-2 pr-4">{p.ba}</td>
                <td className="py-2 pr-4">{p.hr ?? "-"}</td>
                <td className="py-2 pr-4">{p.whiff ?? "-"}</td>
                <td className="py-2 pr-4">{p.putAway ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
