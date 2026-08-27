function formatKoreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}년 ${parseInt(m[2], 10)}월 ${parseInt(m[3], 10)}일`;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{value}</p>
    </div>
  );
}

export default function PlayerHeader({
  name,
  jerseyNumber,
  position,
  teamName,
  bio,
}: {
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  teamName: string | null;
  bio: Record<string, unknown>;
}) {
  const initial = name.trim().slice(-1);
  const get = (key: string) => {
    const v = bio[key];
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  };
  const awards = Array.isArray(bio.awards) ? (bio.awards as string[]) : [];

  return (
    <div className="-mx-4 mb-6 flex flex-col gap-6 bg-neutral-100 px-4 py-6 sm:-mx-6 sm:flex-row sm:items-center sm:px-6 dark:bg-neutral-900">
      <div className="flex flex-shrink-0 items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-xl font-semibold text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500">
          {initial}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            <p>{name}</p>
            {jerseyNumber != null && <p className="text-neutral-400 dark:text-neutral-500">#{jerseyNumber}</p>}
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            {position && <p>{position}</p>}
            {position && teamName && <div className="h-3.5 w-px bg-neutral-300 dark:bg-neutral-700" />}
            {teamName && <p>{teamName}</p>}
          </div>
        </div>
      </div>

      <div className="flex-1 border-t border-neutral-200 pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 dark:border-neutral-800">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
          <InfoItem label="생년월일" value={formatKoreanDate(get("birthdate"))} />
          <InfoItem label="투타" value={get("throws_bats")} />
          <InfoItem label="드래프트" value={get("draft_info")} />
          <InfoItem label="학교" value={get("school")} />
          <InfoItem label="데뷔전" value={get("debut_summary") || (get("debut_date") ? formatKoreanDate(get("debut_date")) : "")} />
          <InfoItem label="소속팀" value={get("team_history") || get("club")} />
          <InfoItem label="계약" value={get("contract")} />
          <InfoItem label="신장" value={get("height_cm") ? `${get("height_cm")}cm` : ""} />
        </div>
        {awards.length > 0 && (
          <div className="mt-3">
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">수상실적</p>
            <ul className="mt-1 grid grid-cols-2 gap-x-6 gap-y-0.5">
              {awards.map((line, i) => (
                <li key={i} className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
