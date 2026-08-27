export type HittingHighLine = { hits: number; hr: number; rbi: number; doubles: number; sb: number; bb: number };

const HEADERS = ["구분", "안타", "홈런", "타점", "2루타", "도루", "볼넷"];

export default function PlayerHittingSingleGameHighs({
  season,
  career,
}: {
  season: HittingHighLine | undefined;
  career: HittingHighLine | undefined;
}) {
  if (!season && !career) return null;

  const rows: { label: string; line: HittingHighLine }[] = [];
  if (season) rows.push({ label: "시즌", line: season });
  if (career) rows.push({ label: "커리어", line: career });

  return (
    <div>
      <p className="mb-4 text-base font-semibold">한 경기 최다 성적</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
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
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-neutral-100 dark:border-neutral-900">
                <td className="py-2 pr-4 font-medium">{r.label}</td>
                <td className="py-2 pr-4">{r.line.hits}</td>
                <td className="py-2 pr-4">{r.line.hr}</td>
                <td className="py-2 pr-4">{r.line.rbi}</td>
                <td className="py-2 pr-4">{r.line.doubles}</td>
                <td className="py-2 pr-4">{r.line.sb}</td>
                <td className="py-2 pr-4">{r.line.bb}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
