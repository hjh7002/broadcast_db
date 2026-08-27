"use client";

import { useMemo, useState } from "react";

export type BasketballGameRow = {
  opp: string;
  home?: boolean; // omitted (international/neutral-site games) defaults to "vs" like before
  date: string;
  rd?: string;
  MIN: number | null;
  PTS: number;
  FGM: number;
  FGA: number;
  FGP: number | null;
  P2M: number;
  P2A: number;
  P2P: number | null;
  P3M: number;
  P3A: number;
  P3P: number | null;
  FTM: number;
  FTA: number;
  FTP: number | null;
  OREB: number | null;
  DREB: number | null;
  REB: number;
  AST: number;
  PF: number;
  TO: number;
  STL: number;
  BLK: number;
  PM: number | null;
  EFF: number;
};

// Single-game box score counting stats (MIN/PTS/REB/...) are whole numbers,
// so no decimal formatting — only shooting percentages get 1 decimal place.
function n0(v: number | null | undefined) {
  return typeof v === "number" ? String(v) : "-";
}
function pct1(v: number | null | undefined) {
  return typeof v === "number" ? v.toFixed(1) : "-";
}

function shot(made: number, att: number, pct: number | null) {
  if (att === 0) return "0/0";
  return `${made}/${att} (${pct1(pct)}%)`;
}

type SortDir = "desc" | "asc";

// Each column sorts by a representative value — compound shooting columns (FG/2PT/
// 3PT/FT) sort by makes rather than percentage, since percentage on tiny attempt
// counts (e.g. 1/1) is noisy and would rank misleadingly high.
const COLUMNS: { key: string; label: string; value: (g: BasketballGameRow) => number | string | null }[] = [
  { key: "opp", label: "경기", value: (g) => g.opp },
  { key: "MIN", label: "MIN", value: (g) => g.MIN },
  { key: "PTS", label: "PTS", value: (g) => g.PTS },
  { key: "FG", label: "FG", value: (g) => g.FGM },
  { key: "P2", label: "2PT", value: (g) => g.P2M },
  { key: "P3", label: "3PT", value: (g) => g.P3M },
  { key: "FT", label: "FT", value: (g) => g.FTM },
  { key: "OREB", label: "OREB", value: (g) => g.OREB },
  { key: "DREB", label: "DREB", value: (g) => g.DREB },
  { key: "REB", label: "REB", value: (g) => g.REB },
  { key: "AST", label: "AST", value: (g) => g.AST },
  { key: "PF", label: "PF", value: (g) => g.PF },
  { key: "TO", label: "TO", value: (g) => g.TO },
  { key: "STL", label: "STL", value: (g) => g.STL },
  { key: "BLK", label: "BLK", value: (g) => g.BLK },
  { key: "PM", label: "+/-", value: (g) => g.PM },
  { key: "EFF", label: "EFF", value: (g) => g.EFF },
];

export default function BasketballGameLog({ games }: { games: BasketballGameRow[] | undefined }) {
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir | null>(null);

  const sorted = useMemo(() => {
    if (!games) return games;
    if (!sortKey || !sortDir) return games; // "원래대로" — reset to the order the data arrived in
    const col = COLUMNS.find((c) => c.key === sortKey);
    if (!col) return games;
    return [...games].sort((a, b) => {
      const av = col.value(a);
      const bv = col.value(b);
      if (typeof av === "string" || typeof bv === "string") {
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        return sortDir === "asc" ? cmp : -cmp;
      }
      const an = typeof av === "number" ? av : -Infinity;
      const bn = typeof bv === "number" ? bv : -Infinity;
      return sortDir === "asc" ? an - bn : bn - an;
    });
  }, [games, sortKey, sortDir]);

  if (!games || games.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">아직 경기별 기록이 없어요.</p>;
  }

  const handleHeaderClick = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("desc");
      return;
    }
    if (sortDir === "desc") {
      setSortDir("asc");
      return;
    }
    setSortKey(null);
    setSortDir(null);
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
      >
        게임 로그 ({games.length})
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-3 py-2 font-medium">
                    <button
                      type="button"
                      onClick={() => handleHeaderClick(col.key)}
                      className={`flex items-center gap-0.5 whitespace-nowrap hover:text-neutral-900 dark:hover:text-neutral-100 ${
                        sortKey === col.key ? "text-neutral-900 dark:text-neutral-100" : ""
                      }`}
                    >
                      {col.label}
                      <span className="text-[10px]">
                        {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
              {(sorted ?? games).map((g, i) => (
                <tr key={i} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {g.home === false ? "@" : "vs"} {g.opp}
                    <span className="ml-1.5 text-xs text-neutral-400 dark:text-neutral-500">{g.date}</span>
                    {g.rd === "평가전" && (
                      <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        평가전
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{n0(g.MIN)}</td>
                  <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">{n0(g.PTS)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{shot(g.FGM, g.FGA, g.FGP)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{shot(g.P2M, g.P2A, g.P2P)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{shot(g.P3M, g.P3A, g.P3P)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{shot(g.FTM, g.FTA, g.FTP)}</td>
                  <td className="px-3 py-2">{n0(g.OREB)}</td>
                  <td className="px-3 py-2">{n0(g.DREB)}</td>
                  <td className="px-3 py-2">{n0(g.REB)}</td>
                  <td className="px-3 py-2">{n0(g.AST)}</td>
                  <td className="px-3 py-2">{n0(g.PF)}</td>
                  <td className="px-3 py-2">{n0(g.TO)}</td>
                  <td className="px-3 py-2">{n0(g.STL)}</td>
                  <td className="px-3 py-2">{n0(g.BLK)}</td>
                  <td className="px-3 py-2">{g.PM == null ? "-" : g.PM > 0 ? `+${g.PM}` : g.PM}</td>
                  <td className="px-3 py-2">{n0(g.EFF)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
