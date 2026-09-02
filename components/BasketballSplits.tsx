"use client";

import { useState } from "react";

export type SplitRow = {
  label: string;
  GP: number;
  W?: number;
  L?: number;
  PTS: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  FG_PCT: number | null;
  FG3_PCT: number | null;
  FT_PCT: number | null;
  PM?: number | null;
};

export type BasketballSplitsData = {
  home_road?: SplitRow[];
  result?: SplitRow[];
  pre_post_allstar?: SplitRow[];
  month?: SplitRow[];
  days_rest?: SplitRow[];
  vs_opponent?: SplitRow[];
};

function n1(v: number | null | undefined) {
  return typeof v === "number" ? v.toFixed(1) : "-";
}

function SplitTable({ rows, showRecord }: { rows: SplitRow[]; showRecord?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium"> </th>
            <th className="px-3 py-2 font-medium">GP</th>
            {showRecord && <th className="px-3 py-2 font-medium">승-패</th>}
            <th className="px-3 py-2 font-medium">득점</th>
            <th className="px-3 py-2 font-medium">리바운드</th>
            <th className="px-3 py-2 font-medium">어시스트</th>
            <th className="px-3 py-2 font-medium">스틸</th>
            <th className="px-3 py-2 font-medium">블록</th>
            <th className="px-3 py-2 font-medium">야투%</th>
            <th className="px-3 py-2 font-medium">3점%</th>
            <th className="px-3 py-2 font-medium">자유투%</th>
            <th className="px-3 py-2 font-medium">+/-</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
          {rows.map((r) => (
            <tr key={r.label} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
              <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100 whitespace-nowrap">{r.label}</td>
              <td className="px-3 py-2">{r.GP}</td>
              {showRecord && <td className="px-3 py-2">{r.W ?? "-"}-{r.L ?? "-"}</td>}
              <td className="px-3 py-2">{n1(r.PTS)}</td>
              <td className="px-3 py-2">{n1(r.REB)}</td>
              <td className="px-3 py-2">{n1(r.AST)}</td>
              <td className="px-3 py-2">{n1(r.STL)}</td>
              <td className="px-3 py-2">{n1(r.BLK)}</td>
              <td className="px-3 py-2">{n1(r.FG_PCT)}</td>
              <td className="px-3 py-2">{n1(r.FG3_PCT)}</td>
              <td className="px-3 py-2">{n1(r.FT_PCT)}</td>
              <td className="px-3 py-2">{r.PM == null ? "-" : r.PM > 0 ? `+${r.PM.toFixed(1)}` : r.PM.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function BasketballSplits({ splits }: { splits: BasketballSplitsData | undefined }) {
  const [oppOpen, setOppOpen] = useState(false);
  if (!splits) return null;
  const hasAny =
    splits.home_road?.length ||
    splits.result?.length ||
    splits.pre_post_allstar?.length ||
    splits.month?.length ||
    splits.days_rest?.length ||
    splits.vs_opponent?.length;
  if (!hasAny) return null;

  return (
    <div className="space-y-6">
      {(splits.home_road?.length || splits.result?.length || splits.pre_post_allstar?.length || splits.days_rest?.length) ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {splits.home_road?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">홈/원정</h3>
              <SplitTable rows={splits.home_road} />
            </div>
          ) : null}
          {splits.result?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">승/패</h3>
              <SplitTable rows={splits.result} />
            </div>
          ) : null}
          {splits.pre_post_allstar?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">전반기/후반기</h3>
              <SplitTable rows={splits.pre_post_allstar} />
            </div>
          ) : null}
          {splits.days_rest?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">휴식일별</h3>
              <SplitTable rows={splits.days_rest} />
            </div>
          ) : null}
        </div>
      ) : null}

      {splits.month?.length ? (
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">월별</h3>
          <SplitTable rows={splits.month} />
        </div>
      ) : null}

      {splits.vs_opponent?.length ? (
        <div>
          <button
            type="button"
            onClick={() => setOppOpen((o) => !o)}
            className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
          >
            상대팀별 기록 ({splits.vs_opponent.length})
            <span className={`transition-transform ${oppOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          {oppOpen && (
            <div className="mt-2">
              <SplitTable rows={splits.vs_opponent} showRecord />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
