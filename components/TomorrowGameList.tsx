import Link from "next/link";
import type { MlbPreviewGame } from "@/lib/todaySchedule";

function gameHref(g: MlbPreviewGame): string {
  const params = new URLSearchParams({
    awayName: g.awayName,
    homeName: g.homeName,
    gamePk: String(g.gamePk),
  });
  if (g.awayPitcher) {
    params.set("awayPitcherId", String(g.awayPitcher.id));
    params.set("awayPitcherName", g.awayPitcher.name);
  }
  if (g.homePitcher) {
    params.set("homePitcherId", String(g.homePitcher.id));
    params.set("homePitcherName", g.homePitcher.name);
  }
  return `/broadcast/tomorrow?${params.toString()}`;
}

export default function TomorrowGameList({ games }: { games: MlbPreviewGame[] }) {
  if (games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">내일 예정된 MLB 경기가 없어요.</p>;
  }

  return (
    <div className="space-y-2">
      {games.map((g) => (
        <Link
          key={g.gamePk}
          href={gameHref(g)}
          className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {g.awayName} @ {g.homeName}
            </span>
            {(g.awayPitcher || g.homePitcher) && (
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {g.awayPitcher?.name ?? "미정"} vs {g.homePitcher?.name ?? "미정"}
              </span>
            )}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{g.timeLabel}</span>
        </Link>
      ))}
    </div>
  );
}
