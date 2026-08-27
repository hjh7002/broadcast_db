"use client";

import { useState } from "react";
import type { SportStatField } from "@/lib/supabase/types";

type YearRow = { season: number; team?: string } & Record<string, unknown>;

export default function PlayerCareerByYear({
  statFields,
  years,
  career,
  label = "통산 연도별 기록",
  totalLabel = "현재 통산",
}: {
  statFields: SportStatField[];
  years: YearRow[] | undefined;
  career: Record<string, unknown> | undefined;
  label?: string;
  totalLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  if ((!years || years.length === 0) && !career) return null;

  const present = statFields.filter(
    (f) =>
      (years ?? []).some((y) => y[f.stat_key] !== undefined && y[f.stat_key] !== null) ||
      (career && career[f.stat_key] !== undefined && career[f.stat_key] !== null),
  );

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        {label}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="py-2 pr-4 font-normal">연도</th>
                {present.map((f) => (
                  <th key={f.id} className="py-2 pr-4 font-normal whitespace-nowrap">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(years ?? []).map((y) => (
                <tr key={`${y.season}-${y.team ?? ""}`} className="border-b border-neutral-100 dark:border-neutral-900">
                  <td className="py-2 pr-4 font-medium whitespace-nowrap">
                    {y.season}
                    {y.team ? ` ${y.team}` : ""}
                  </td>
                  {present.map((f) => (
                    <td key={f.id} className="py-2 pr-4">
                      {y[f.stat_key] != null ? String(y[f.stat_key]) : "-"}
                    </td>
                  ))}
                </tr>
              ))}
              {career && (
                <tr className="border-t-2 border-neutral-300 font-semibold dark:border-neutral-700">
                  <td className="py-2 pr-4 whitespace-nowrap">{totalLabel}</td>
                  {present.map((f) => (
                    <td key={f.id} className="py-2 pr-4">
                      {career[f.stat_key] != null ? String(career[f.stat_key]) : "-"}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
