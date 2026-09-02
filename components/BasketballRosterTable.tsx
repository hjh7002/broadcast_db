"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Player, SportStatField } from "@/lib/supabase/types";

function bioField(bio: Record<string, unknown>, key: string): string {
  const v = bio[key];
  return typeof v === "string" && v.length > 0 ? v : "-";
}

function statField(stats: Record<string, unknown>, key: string): string {
  const v = stats[key];
  if (typeof v !== "number") return "-";
  return key === "GP" ? String(v) : v.toFixed(1);
}

type SortKey = string;

function RosterTable({
  players,
  sportCode,
  sortKey,
  setSortKey,
  columns,
}: {
  players: Player[];
  sportCode: string;
  sortKey: SortKey | null;
  setSortKey: (k: SortKey | null) => void;
  columns: { key: string; label: string }[];
}) {
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
            {columns.map((col) => (
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
          {players.map((player) => {
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
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2 text-left">
                    {statField(stats, col.key)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const DEFAULT_COLUMNS = [
  { key: "PTS", label: "득점" },
  { key: "REB", label: "리바운드" },
  { key: "AST", label: "어시스트" },
];

export default function BasketballRosterTable({
  players,
  sportCode,
  finalRosterIds,
  statFields,
}: {
  players: Player[];
  sportCode: string;
  finalRosterIds?: string[];
  // Sport-specific columns, in `sport_stat_fields` order. Omit to keep the
  // original basketball-shaped PTS/REB/AST columns (this component started
  // out basketball-only and other sports have been opting into it since).
  statFields?: SportStatField[];
}) {
  const columns = statFields ? statFields.map((f) => ({ key: f.stat_key, label: f.label })) : DEFAULT_COLUMNS;
  const [sortKey, setSortKey] = useState<SortKey | null>(null);

  const sort = (list: Player[]) => {
    if (!sortKey) return list;
    return [...list].sort((a, b) => {
      const av = (a.stats as Record<string, unknown>)[sortKey];
      const bv = (b.stats as Record<string, unknown>)[sortKey];
      const an = typeof av === "number" ? av : -Infinity;
      const bn = typeof bv === "number" ? bv : -Infinity;
      return bn - an; // 내림차순
    });
  };

  const sorted = useMemo(() => sort(players), [players, sortKey]);

  // When a game-day final roster is set (e.g. Lebanon's 24-man extended pool vs
  // their 12-man roster for a specific match), split the table instead of
  // dumping everyone into one undifferentiated list.
  if (finalRosterIds && finalRosterIds.length > 0) {
    const finalSet = new Set(finalRosterIds);
    const final = sorted.filter((p) => finalSet.has(p.id));
    const rest = sorted.filter((p) => !finalSet.has(p.id));
    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            최종 로스터 ({final.length})
          </h3>
          <RosterTable players={final} sportCode={sportCode} sortKey={sortKey} setSortKey={setSortKey} columns={columns} />
        </div>
        {rest.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
              기타 소집 선수 ({rest.length})
            </h3>
            <RosterTable players={rest} sportCode={sportCode} sortKey={sortKey} setSortKey={setSortKey} columns={columns} />
          </div>
        )}
      </div>
    );
  }

  return <RosterTable players={sorted} sportCode={sportCode} sortKey={sortKey} setSortKey={setSortKey} columns={columns} />;
}
