function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 py-3 dark:border-neutral-900">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{value || "-"}</p>
    </div>
  );
}

function formatKoreanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${m[1]}년 ${parseInt(m[2], 10)}월 ${parseInt(m[3], 10)}일`;
}

export default function PlayerProfileList({ bio }: { bio: Record<string, unknown> }) {
  const get = (key: string) => {
    const v = bio[key];
    return typeof v === "string" || typeof v === "number" ? String(v) : "";
  };
  const getDate = (key: string) => {
    const v = get(key);
    return v ? formatKoreanDate(v) : "";
  };

  return (
    <div>
      <Row label="출생" value={getDate("birthdate")} />
      <Row label="드래프트" value={get("draft_info") || get("draft_year")} />
      <Row label="데뷔" value={getDate("debut_date")} />
      <Row label="서비스 타임" value={get("service_years") ? `${get("service_years")}년차` : ""} />
      <Row label="투타" value={get("throws_bats")} />
      <Row label="신체" value={get("height_weight")} />
      <Row label="출신학교" value={get("school")} />
      <Row label="현재상태" value={get("roster_status") || "1군 로스터"} />
    </div>
  );
}
