"use client";

import { useState } from "react";
import type { Player } from "@/lib/supabase/types";
import PlayerFloatingCard from "@/components/PlayerFloatingCard";

const COLUMNS: { key: string; label: string; suffix?: string }[] = [
  { key: "PTS", label: "점수" },
  { key: "REB", label: "리바" },
  { key: "OREB", label: "OR" },
  { key: "AST", label: "어시" },
  { key: "STL", label: "스틸" },
  { key: "BLK", label: "블록" },
  { key: "FG3M", label: "3PM" },
  { key: "FG_PCT", label: "FG%", suffix: "%" },
  { key: "FG3_PCT", label: "3P%", suffix: "%" },
  { key: "FT_PCT", label: "FT%", suffix: "%" },
  { key: "TO", label: "TO" },
];

function statCell(stats: Record<string, unknown>, key: string, suffix?: string): string {
  const v = stats[key];
  return typeof v === "number" ? `${v.toFixed(1)}${suffix ?? ""}` : "-";
}

// Names are "한글 English" for non-Korea rosters — on one line the two scripts
// crowd together, so split at the first Latin character and put English on its own line.
function splitName(name: string): { ko: string; en: string | null } {
  const idx = name.search(/[A-Za-z]/);
  if (idx <= 0) return { ko: name, en: null };
  return { ko: name.slice(0, idx).trim(), en: name.slice(idx).trim() };
}

export default function BasketballBroadcastRoster({
  sportCode,
  players,
  finalRosterIds,
}: {
  sportCode: string;
  players: Player[];
  finalRosterIds?: string[];
}) {
  const [selected, setSelected] = useState<Player | null>(null);
  const activePlayers =
    finalRosterIds && finalRosterIds.length > 0
      ? players.filter((p) => finalRosterIds.includes(p.id))
      : players;
  if (activePlayers.length === 0) return null;
  const sorted = [...activePlayers].sort((a, b) => (a.jersey_number ?? 999) - (b.jersey_number ?? 999));

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
            <tr>
              <th className="px-2 py-1.5 font-medium">선수</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-1.5 py-1.5 font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {sorted.map((p) => {
              const stats = (p.stats as Record<string, unknown>) ?? {};
              const { ko, en } = splitName(p.name);
              return (
                <tr key={p.id}>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => setSelected(p)}
                      aria-label={`${p.name} 상세 정보`}
                      className="text-left font-medium text-neutral-900 hover:underline dark:text-neutral-100"
                    >
                      <span className="block whitespace-nowrap">
                        {p.jersey_number != null ? `#${p.jersey_number} ` : ""}
                        {ko}
                      </span>
                      {en && (
                        <span className="block whitespace-nowrap font-normal text-neutral-500 dark:text-neutral-400">
                          {en}
                        </span>
                      )}
                    </button>
                  </td>
                  {COLUMNS.map((c) => (
                    <td key={c.key} className="px-1.5 py-1.5 whitespace-nowrap text-neutral-700 dark:text-neutral-300">
                      {statCell(stats, c.key, c.suffix)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <PlayerFloatingCard player={selected} sportCode={sportCode} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
