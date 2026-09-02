"use client";

import { useState } from "react";

export type CompetitionRecord = {
  competition: string;
  results: { year: number; result: string }[];
};

export default function TeamCompetitionHistory({
  history,
  label = "국제 대회 성적",
}: {
  history: CompetitionRecord[] | undefined;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!history || history.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-lg font-medium text-neutral-900 hover:text-neutral-600 dark:text-neutral-100 dark:hover:text-neutral-300"
      >
        {label}
        <span className={`text-sm transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="mt-3 space-y-5">
          {history.map((c) => (
            <div key={c.competition}>
              <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">{c.competition}</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                {c.results.map((r) => (
                  <span key={r.year} className="whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                    <span className="text-neutral-400 dark:text-neutral-500">{r.year}</span>{" "}
                    <span
                      className={
                        r.result.includes("1위")
                          ? "font-semibold text-amber-600 dark:text-amber-400"
                          : "text-neutral-700 dark:text-neutral-200"
                      }
                    >
                      {r.result}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
