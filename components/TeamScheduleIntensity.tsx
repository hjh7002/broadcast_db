"use client";

import { useState } from "react";

export type ScheduleIntensity = {
  season: string;
  totalGames: number;
  back_to_backs: { count: number; occurrences: string[] };
  three_in_four: { count: number; occurrences: string[] };
};

function IntensityCard({
  label,
  count,
  totalGames,
  occurrences,
  hint,
}: {
  label: string;
  count: number;
  totalGames: number;
  occurrences: string[];
  hint: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
        {count}회
        <span className="ml-1.5 text-sm font-normal text-neutral-400 dark:text-neutral-500">/ {totalGames}경기 중</span>
      </p>
      <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{hint}</p>
      {occurrences.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            날짜 보기
            <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
          </button>
          {open && (
            <ul className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-neutral-500 dark:text-neutral-400 sm:grid-cols-3">
              {occurrences.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeamScheduleIntensity({ data }: { data: ScheduleIntensity | undefined }) {
  if (!data) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-lg font-medium">{data.season} 일정 강도</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <IntensityCard
          label="백투백 (0일 휴식)"
          count={data.back_to_backs.count}
          totalGames={data.totalGames}
          occurrences={data.back_to_backs.occurrences}
          hint="캘린더상 연속된 이틀에 경기 — 2번째 경기 기준 카운트"
        />
        <IntensityCard
          label="4일간 3연전"
          count={data.three_in_four.count}
          totalGames={data.totalGames}
          occurrences={data.three_in_four.occurrences}
          hint="달력 4일 안에 경기 3번 — 3번째 경기 기준 카운트, 겹치는 구간도 각각 집계"
        />
      </div>
    </div>
  );
}
