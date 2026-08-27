type AvgRow = { label: string; avg: string };
type AvgHrOpsRow = { label: string; avg: string; hr: number; ops: string };
type HomeAwayRow = { label: string; games: number; avg: string; hr: number };
type HandRow = { label: string; avg: string; hr: number };
type OppLine = { games: number; avg: string; ops: string; hr: number; rbi: number };

export type HittingStreak = { games: number; ab: number; hits: number; hr: number; doubles: number; avg: string; ops: string };

export type HittingSplitsInfo = {
  homeAway?: HomeAwayRow[];
  vsHand?: HandRow[];
  byMonth?: AvgHrOpsRow[];
  byHalf?: AvgHrOpsRow[];
  byCount?: AvgRow[];
  byRunners?: AvgRow[];
  vsOpponent?: { opponent: string; career: OppLine; season: OppLine };
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 inline-block rounded bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
      {children}
    </p>
  );
}

function AvgRowTable({ title, rows }: { title: string; rows: AvgRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex w-fit divide-x divide-neutral-200 overflow-x-auto rounded-md bg-neutral-100 dark:divide-neutral-800 dark:bg-neutral-900">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col items-center justify-center gap-1 px-3 py-2.5">
            <p className="whitespace-nowrap text-[11px] font-bold text-neutral-500 dark:text-neutral-400">{r.label}</p>
            <p className="whitespace-nowrap text-base font-semibold text-neutral-900 dark:text-neutral-100">{r.avg}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvgHrOpsTable({ title, rows }: { title: string; rows: AvgHrOpsRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="flex w-fit divide-x divide-neutral-200 overflow-x-auto rounded-md bg-neutral-100 dark:divide-neutral-800 dark:bg-neutral-900">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col items-center justify-center gap-1 px-3 py-2.5">
            <p className="whitespace-nowrap text-[11px] font-bold text-neutral-500 dark:text-neutral-400">{r.label}</p>
            <p className="whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {r.avg} {r.hr}홈런
            </p>
            <p className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">OPS {r.ops}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HomeAwayLine({ rows }: { rows: HomeAwayRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>홈 / 원정</SectionTitle>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {rows.map((r) => `${r.label} ${r.games}G ${r.avg} ${r.hr}홈런`).join(" | ")}
      </p>
    </div>
  );
}

function HandLine({ rows }: { rows: HandRow[] | undefined }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div>
      <SectionTitle>좌/우투수 상대 성적</SectionTitle>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {rows.map((r) => `${r.label} ${r.avg} ${r.hr}홈런`).join(" | ")}
      </p>
    </div>
  );
}

function OpponentLine({ data }: { data: HittingSplitsInfo["vsOpponent"] }) {
  if (!data) return null;
  return (
    <div>
      <SectionTitle>{data.opponent} 상대 전적</SectionTitle>
      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
        {`시즌 ${data.season.games}경기 ${data.season.avg} OPS ${data.season.ops} ${data.season.hr}홈런 ${data.season.rbi}타점`} |{" "}
        {`통산 ${data.career.games}경기 ${data.career.avg} OPS ${data.career.ops} ${data.career.hr}홈런 ${data.career.rbi}타점`}
      </p>
    </div>
  );
}

export default function PlayerHittingSplits({ splits }: { splits: HittingSplitsInfo | undefined }) {
  if (!splits) return null;

  return (
    <div className="space-y-6">
      <p className="text-base font-semibold">스플릿</p>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <HomeAwayLine rows={splits.homeAway} />
        <HandLine rows={splits.vsHand} />
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <AvgHrOpsTable title="전/후반기 성적" rows={splits.byHalf} />
        <AvgHrOpsTable title="월별 성적" rows={splits.byMonth} />
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <AvgRowTable title="볼카운트별 성적" rows={splits.byCount} />
        <AvgRowTable title="주자별 성적" rows={splits.byRunners} />
      </div>
      <OpponentLine data={splits.vsOpponent} />
    </div>
  );
}
