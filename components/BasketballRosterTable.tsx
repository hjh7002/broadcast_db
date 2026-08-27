"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/supabase/types";

function bioField(bio: Record<string, unknown>, key: string): string {
  const v = bio[key];
  return typeof v === "string" && v.length > 0 ? v : "-";
}

function statField(stats: Record<string, unknown>, key: string): string {
  const v = stats[key];
  return typeof v === "number" ? v.toFixed(1) : "-";
}

const SORTABLE_COLUMNS = [
  { key: "PTS", label: "득점" },
  { key: "REB", label: "리바운드" },
  { key: "AST", label: "어시스트" },
] as const;

type SortKey = (typeof SORTABLE_COLUMNS)[number]["key"];

export default function BasketballRosterTable({
  players,
  sportCode,
}: {
  players: Player[];
  sportCode: string;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);

  const sorted = useMemo(() => {
    if (!sortKey) return players;
    return [...players].sort((a, b) => {
      const av = (a.stats as Record<string, unknown>)[sortKey];
      const bv = (b.stats as Record<string, unknown>)[sortKey];
      const an = typeof av === "number" ? av : -Infinity;
      const bn = typeof bv === "number" ? bv : -Infinity;
      return bn - an; // 내림차순
    });
  }, [players, sortKey]);

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium">등번호</th>
            <th className="px-3 py-2 font-medium">이름</th>
            <th className="px-3 py-2 font-medium">포지션</th>
            <th className="px-3 py-2 font-medium">신장</th>
            <th className="px-3 py-2 font-medium">생년월일</th>
            <th className="px-3 py-2 font-medium">소속팀</th>
            {SORTABLE_COLUMNS.map((col) => (
              <th key={col.key} className="px-3 py-2 font-medium">
                <button
                  type="button"
                  onClick={() => setSortKey(sortKey === col.key ? null : col.key)}
                  className={`flex items-center gap-0.5 hover:text-neutral-900 dark:hover:text-neutral-100 ${
                    sortKey === col.key ? "text-neutral-900 dark:text-neutral-100" : ""
                  }`}
                >
                  {col.label}
                  <span className="text-[10px]">{sortKey === col.key ? "▼" : ""}</span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
          {sorted.map((player) => {
            const bio = player.bio as Record<string, unknown>;
            const stats = player.stats as Record<string, unknown>;
            const heightCm = bio.height_cm;
            return (
              <tr key={player.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900">
                <td className="px-3 py-2 text-left text-neutral-500 dark:text-neutral-400">
                  {player.jersey_number != null ? `#${player.jersey_number}` : "-"}
                </td>
                <td className="px-3 py-2 text-left font-medium text-neutral-900 dark:text-neutral-100">
                  <Link href={`/${sportCode}/players/${player.id}`} className="hover:underline">
                    {player.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-left">{player.position ?? "-"}</td>
                <td className="px-3 py-2 text-left">{typeof heightCm === "number" ? `${heightCm}cm` : "-"}</td>
                <td className="px-3 py-2 text-left">{bioField(bio, "birthdate")}</td>
                <td className="px-3 py-2 text-left">{bioField(bio, "club")}</td>
                <td className="px-3 py-2 text-left">{statField(stats, "PTS")}</td>
                <td className="px-3 py-2 text-left">{statField(stats, "REB")}</td>
                <td className="px-3 py-2 text-left">{statField(stats, "AST")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
