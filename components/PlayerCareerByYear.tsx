"use client";

import { Fragment, useState } from "react";
import type { SportStatField } from "@/lib/supabase/types";

type YearRow = { season: number; team?: string; teams?: YearRow[] } & Record<string, unknown>;

// GP is a count and never takes decimals; every other numeric stat in these
// tables is a per-game average, shown to exactly 1 decimal for a consistent
// column even when the source API drops a trailing zero (e.g. "8" vs "8.0").
function formatValue(statKey: string, v: unknown): string {
  if (typeof v !== "number") return v == null ? "-" : String(v);
  if (statKey === "GP") return String(v);
  const formatted = v.toFixed(1);
  return statKey === "PM" && v > 0 ? `+${formatted}` : formatted;
}

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
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  if ((!years || years.length === 0) && !career) return null;

  const present = statFields.filter(
    (f) =>
      (years ?? []).some((y) => y[f.stat_key] !== undefined && y[f.stat_key] !== null) ||
      (career && career[f.stat_key] !== undefined && career[f.stat_key] !== null),
  );

  const toggleRow = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderRow = (y: YearRow, key: string, sub?: boolean) => (
    <tr key={key} className={`border-b border-neutral-100 dark:border-neutral-900 ${sub ? "text-neutral-500 dark:text-neutral-400" : ""}`}>
      <td className="py-2 pr-4 font-medium whitespace-nowrap">
        {sub && <span className="mr-1 text-neutral-300 dark:text-neutral-600">└</span>}
        {!sub && y.teams && y.teams.length > 0 ? (
          <button
            type="button"
            onClick={() => toggleRow(key)}
            className="mr-1 inline-flex items-center gap-1 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <span className={`text-[10px] transition-transform ${expanded.has(key) ? "rotate-90" : ""}`}>▸</span>
          </button>
        ) : null}
        {y.season}
        {y.team ? ` ${y.team}` : ""}
      </td>
      {present.map((f) => {
        const rank = y[`${f.stat_key}_RANK`] as number | undefined;
        return (
          <td key={f.id} className="py-2 pr-4 whitespace-nowrap">
            {formatValue(f.stat_key, y[f.stat_key])}
            {rank != null && (
              <span className="ml-1 text-xs font-medium text-amber-600 dark:text-amber-400">{rank}위</span>
            )}
          </td>
        );
      })}
    </tr>
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
              {(years ?? []).map((y) => {
                const key = `${y.season}-${y.team ?? ""}`;
                return (
                  <Fragment key={key}>
                    {renderRow(y, key)}
                    {y.teams && expanded.has(key) && y.teams.map((t, i) => renderRow(t, `${key}-${i}`, true))}
                  </Fragment>
                );
              })}
              {career && (
                <tr className="border-t-2 border-neutral-300 font-semibold dark:border-neutral-700">
                  <td className="py-2 pr-4 whitespace-nowrap">{totalLabel}</td>
                  {present.map((f) => (
                    <td key={f.id} className="py-2 pr-4">
                      {formatValue(f.stat_key, career[f.stat_key])}
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
