"use client";

import Link from "next/link";
import type { Player } from "@/lib/supabase/types";

const SUMMARY_FIELDS: { key: string; label: string; suffix?: string }[] = [
  { key: "PTS", label: "득점" },
  { key: "REB", label: "리바운드" },
  { key: "AST", label: "어시스트" },
  { key: "STL", label: "스틸" },
  { key: "BLK", label: "블록" },
  { key: "FG_PCT", label: "FG%", suffix: "%" },
  { key: "FG3_PCT", label: "3P%", suffix: "%" },
  { key: "FT_PCT", label: "FT%", suffix: "%" },
];

function fmt(v: unknown, suffix?: string): string {
  if (typeof v !== "number") return "-";
  return `${v.toFixed(1)}${suffix ?? ""}`;
}

type GameLogRow = {
  opp: string;
  date: string;
  MIN: number | null;
  PTS: number;
  REB: number;
  AST: number;
  STL: number;
  BLK: number;
  FGM: number;
  FGA: number;
  P3M: number;
  P3A: number;
};

function n0(v: number | null | undefined): string {
  return typeof v === "number" ? String(v) : "-";
}

export default function PlayerFloatingCard({
  player,
  sportCode,
  onClose,
}: {
  player: Player;
  sportCode: string;
  onClose: () => void;
}) {
  const bio = (player.bio as Record<string, unknown>) ?? {};
  const stats = (player.stats as Record<string, unknown>) ?? {};
  const memo = typeof bio.memo === "string" ? bio.memo : null;
  const fg3m = typeof stats.FG3M === "number" ? stats.FG3M.toFixed(1) : null;
  const gameLog = (stats.GAME_LOG as GameLogRow[] | undefined) ?? [];
  const recentGames = gameLog.slice(-3).reverse();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {player.name}
              {player.jersey_number != null && (
                <span className="ml-1.5 text-sm font-normal text-neutral-400 dark:text-neutral-500">
                  #{player.jersey_number}
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {[player.position, bio.height_cm ? `${bio.height_cm}cm` : null, bio.club as string | undefined]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-x-2 gap-y-3 text-center">
          {SUMMARY_FIELDS.map((f) => (
            <div key={f.key}>
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {fmt(stats[f.key], f.suffix)}
              </p>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                {f.label}
                {f.key === "FG3_PCT" && fg3m && ` (${fg3m})`}
              </p>
            </div>
          ))}
        </div>

        {recentGames.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-[11px] font-medium text-neutral-500 dark:text-neutral-400">최근 경기</p>
            <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                  <tr>
                    <th className="px-2 py-1.5 font-medium">경기</th>
                    <th className="px-2 py-1.5 font-medium">MIN</th>
                    <th className="px-2 py-1.5 font-medium">PTS</th>
                    <th className="px-2 py-1.5 font-medium">REB</th>
                    <th className="px-2 py-1.5 font-medium">AST</th>
                    <th className="px-2 py-1.5 font-medium">STL</th>
                    <th className="px-2 py-1.5 font-medium">BLK</th>
                    <th className="px-2 py-1.5 font-medium">FG</th>
                    <th className="px-2 py-1.5 font-medium">3P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
                  {recentGames.map((g, i) => (
                    <tr key={i}>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        vs {g.opp} <span className="text-neutral-400 dark:text-neutral-500">{g.date}</span>
                      </td>
                      <td className="px-2 py-1.5">{n0(g.MIN)}</td>
                      <td className="px-2 py-1.5 font-medium">{n0(g.PTS)}</td>
                      <td className="px-2 py-1.5">{n0(g.REB)}</td>
                      <td className="px-2 py-1.5">{n0(g.AST)}</td>
                      <td className="px-2 py-1.5">{n0(g.STL)}</td>
                      <td className="px-2 py-1.5">{n0(g.BLK)}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {g.FGA ? `${g.FGM}/${g.FGA}` : "-"}
                      </td>
                      <td className="px-2 py-1.5 whitespace-nowrap">
                        {g.P3A ? `${g.P3M}/${g.P3A}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {memo && (
          <p className="mt-4 whitespace-pre-wrap rounded-md bg-amber-50 p-2.5 text-xs text-neutral-700 dark:bg-amber-950/30 dark:text-neutral-300">
            {memo}
          </p>
        )}

        <Link
          href={`/${sportCode}/players/${player.id}`}
          className="mt-4 block text-center text-xs text-neutral-500 hover:underline dark:text-neutral-400"
        >
          선수 페이지에서 더보기 →
        </Link>
      </div>
    </div>
  );
}
