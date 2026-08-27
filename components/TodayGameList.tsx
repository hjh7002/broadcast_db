"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleGame } from "@/lib/todaySchedule";

const SPORT_LABEL: Record<string, string> = { mlb: "MLB", kbo: "KBO" };

function gameKey(g: ScheduleGame): string {
  return `${g.sportCode}-${g.awayName}-${g.homeName}`;
}

export default function TodayGameList({ games }: { games: ScheduleGame[] }) {
  const router = useRouter();
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectGame(g: ScheduleGame) {
    setLoadingKey(gameKey(g));
    setError(null);
    try {
      const res = await fetch("/api/broadcast/quick-start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sportCode: g.sportCode, homeName: g.homeName, awayName: g.awayName }),
      });
      if (!res.ok) throw new Error("failed");
      router.push("/broadcast");
      router.refresh();
    } catch {
      setError("중계 준비 중 오류가 발생했어요.");
      setLoadingKey(null);
    }
  }

  if (games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">오늘 예정된 경기가 없어요.</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-500">{error}</p>}
      {games.map((g) => {
        const key = gameKey(g);
        return (
          <button
            key={key}
            type="button"
            onClick={() => selectGame(g)}
            disabled={loadingKey !== null}
            className="flex w-full items-center justify-between rounded-lg border border-neutral-200 px-4 py-3 text-left hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            <span className="flex items-center gap-3">
              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {SPORT_LABEL[g.sportCode] ?? g.sportCode}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {g.awayName} @ {g.homeName}
              </span>
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {loadingKey === key ? "준비 중..." : `${g.timeLabel} · ${g.status}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
