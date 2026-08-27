type EraRow = { label: string; era: string };
type WLRow = { label: string; games: number; wins: number; losses: number; era: string };
type HandRow = { label: string; avg: string; hr: number; so: number };
type OppLine = { games: number; wins: number; losses: number; era: string };

export type SplitsInfo = {
  homeAway?: WLRow[];
  byMonth?: EraRow[];
  vsHand?: HandRow[];
  byInning?: EraRow[];
  byRest?: EraRow[];
  byRole?: WLRow[];
  vsOpponent?: { opponent: string; career: OppLine; season: OppLine };
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 inline-block rounded bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      {children}
    </p>
  );
}

function EraRowTable({ title, rows }: { title: string; rows: EraRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex w-fit divide-x divide-neutral-200 overflow-x-auto rounded-md bg-neutral-100 dark:divide-neutral-800 dark:bg-neutral-900">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col items-center justify-center gap-1 px-3 py-2.5">
            <p className="whitespace-nowrap text-[11px] font-bold text-neutral-500 dark:text-neutral-400">{r.label}</p>
            <p className="whitespace-nowrap text-base font-semibold text-neutral-900 dark:text-neutral-100">
              ERA {r.era}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WLLine({ title, rows }: { title: string; rows: WLRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {rows.map((r) => `${r.label} ${r.games}G ${r.wins}-${r.losses} ${r.era}`).join(" | ")}
      </p>
    </div>
  );
}

function HandLine({ rows }: { rows: HandRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>좌/우타자 상대 성적</SectionTitle>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {rows.map((r) => `${r.label} ${r.avg} ${r.hr}홈런 ${r.so}K`).join(" | ")}
      </p>
    </div>
  );
}

function OpponentLine({ data }: { data: SplitsInfo["vsOpponent"] }) {
  if (!data) return null;
  return (
    <div>
      <SectionTitle>{data.opponent} 상대 전적</SectionTitle>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {`시즌 ${data.season.games}경기 ${data.season.wins}승 ${data.season.era}`} |{" "}
        {`통산 ${data.career.games}경기 ${data.career.wins}승 ${data.career.era}`}
      </p>
    </div>
  );
}

export default function PlayerSplitsInfo({ splits }: { splits: SplitsInfo | undefined }) {
  if (!splits) return null;

  return (
    <div className="space-y-6">
      <p className="text-base font-semibold">스플릿</p>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <WLLine title="홈 / 원정" rows={splits.homeAway} />
        <HandLine rows={splits.vsHand} />
        <EraRowTable title="휴식일별 성적" rows={splits.byRest} />
        <WLLine title="선발 / 구원" rows={splits.byRole} />
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <EraRowTable title="월별 성적" rows={splits.byMonth} />
        <EraRowTable title="이닝별 성적" rows={splits.byInning} />
      </div>
      <OpponentLine data={splits.vsOpponent} />
    </div>
  );
}
