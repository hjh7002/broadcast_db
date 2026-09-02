export type SeasonRecord = {
  season: string; // "2021-22"
  wins: number;
  losses: number;
  conferenceRank: number; // 1 = best
  playoff: string; // "미진출" | "1R 탈락" | "2R 탈락" | "WCF 탈락" | "FINAL 탈락" | "FINAL 우승"
  ortg?: number;
  ortgRank?: number; // out of 30 teams
  drtg?: number;
  drtgRank?: number;
  netrtg?: number;
  netrtgRank?: number;
};

const PLAYOFF_STYLE: Record<string, string> = {
  "미진출": "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  "1R 탈락": "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
  "2R 탈락": "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  "WCF 탈락": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200",
  "FINAL 탈락": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  "FINAL 우승": "bg-amber-400 text-amber-950 dark:bg-amber-500 dark:text-amber-950",
};

const WIDTH = 300;
const HEIGHT = 160;
const PAD_TOP = 28;
const PAD_BOTTOM = 16;
const PAD_X = 26;

function MiniLineChart({
  title,
  seasons,
  value,
  invert,
  format,
  rank,
  subLabel,
  tooltipUnit,
}: {
  title: string;
  seasons: SeasonRecord[];
  value: (s: SeasonRecord) => number | undefined;
  invert?: boolean; // for rank, where 1 is best (drawn at the top)
  format: (v: number) => string;
  rank?: (s: SeasonRecord) => number | undefined; // shown as "(n)" next to the value — league rank out of 30
  subLabel?: (s: SeasonRecord) => string; // extra line under the main label, e.g. win-loss record
  tooltipUnit?: string;
}) {
  const points = seasons.map((s) => value(s)).filter((v): v is number => v != null);
  if (points.length === 0) return null;

  const vMin = Math.min(...points);
  const vMax = Math.max(...points);
  const pad = (vMax - vMin) * 0.15 || 1;
  const domainMin = invert ? Math.max(1, vMin - 1) : vMin - pad;
  const domainMax = invert ? vMax + 1 : vMax + pad;
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const step = seasons.length > 1 ? (WIDTH - PAD_X * 2) / (seasons.length - 1) : 0;

  const x = (i: number) => PAD_X + i * step;
  const y = (v: number) => {
    const t = (v - domainMin) / (domainMax - domainMin || 1);
    return invert ? PAD_TOP + t * plotH : PAD_TOP + plotH - t * plotH;
  };

  const linePath = seasons
    .map((s, i) => {
      const v = value(s);
      return v == null ? null : `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`;
    })
    .filter(Boolean)
    .join(" ");

  return (
    <div className="rounded-lg border border-neutral-200 p-2 dark:border-neutral-800">
      <p className="mb-1 text-xs font-medium text-neutral-600 dark:text-neutral-300">{title}</p>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${title}: ${seasons.map((s) => `${s.season} ${value(s) ?? "-"}`).join(", ")}`}
      >
        <path d={linePath} fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="stroke-[#2a78d6] dark:stroke-[#3987e5]" />
        {seasons.map((s, i) => {
          const v = value(s);
          if (v == null) return null;
          return (
            <g key={s.season}>
              <circle cx={x(i)} cy={y(v)} r={3} className="fill-[#2a78d6] dark:fill-[#3987e5] stroke-white dark:stroke-neutral-900" strokeWidth={1.5}>
                <title>
                  {s.season}: {format(v)}
                  {rank?.(s) != null ? ` (${rank(s)}위)` : ""}
                  {tooltipUnit ?? ""}
                </title>
              </circle>
              <text
                x={x(i)}
                y={subLabel ? y(v) - 16 : y(v) - 7}
                textAnchor="middle"
                className="fill-neutral-900 dark:fill-neutral-100"
                fontSize={10}
                fontWeight={600}
              >
                {format(v)}
                {rank?.(s) != null && (
                  <tspan className="fill-neutral-400 dark:fill-neutral-500" fontWeight={400}>
                    ({rank(s)})
                  </tspan>
                )}
              </text>
              {subLabel && (
                <text x={x(i)} y={y(v) - 6} textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400" fontSize={8}>
                  {subLabel(s)}
                </text>
              )}
              <text x={x(i)} y={HEIGHT - PAD_BOTTOM + 12} textAnchor="middle" className="fill-neutral-500 dark:fill-neutral-400" fontSize={9}>
                {s.season.slice(2)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function TeamSeasonTrend({ seasons }: { seasons: SeasonRecord[] | undefined }) {
  if (!seasons || seasons.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">최근 {seasons.length}년 팀 성적</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniLineChart
          title="컨퍼런스 순위 (승-패)"
          seasons={seasons}
          value={(s) => s.conferenceRank}
          invert
          format={(v) => `${v}위`}
        />
        <MiniLineChart title="오펜시브 레이팅" seasons={seasons} value={(s) => s.ortg} rank={(s) => s.ortgRank} format={(v) => v.toFixed(1)} />
        <MiniLineChart title="디펜시브 레이팅" seasons={seasons} value={(s) => s.drtg} rank={(s) => s.drtgRank} format={(v) => v.toFixed(1)} />
        <MiniLineChart
          title="넷 레이팅"
          seasons={seasons}
          value={(s) => s.netrtg}
          rank={(s) => s.netrtgRank}
          format={(v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {seasons.map((s) => (
          <div key={s.season} className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2 py-1 dark:border-neutral-800">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {s.season} ({s.wins}-{s.losses})
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${PLAYOFF_STYLE[s.playoff] ?? "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"}`}>
              {s.playoff}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
