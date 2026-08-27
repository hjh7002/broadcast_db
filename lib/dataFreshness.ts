// A player row not touched in 3+ days is worth flagging — the daily refresh is
// supposed to run every day, so anything older than that usually means it silently
// didn't (see the Drake Baldwin stale-streak incident: stats.updated_at was 5 days
// old while the site kept showing a 5-day-stale hit/on-base streak as current).
const STALE_DAYS = 3;

export function formatUpdatedAt(iso: string): { text: string; stale: boolean } {
  const d = new Date(iso);
  const days = (Date.now() - d.getTime()) / 86400000;
  return { text: d.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }), stale: days >= STALE_DAYS };
}
