import type { SportStatField } from "@/lib/supabase/types";

export default function PlayerStatSummary({
  statFields,
  stats,
  decimals,
  highlightKeys,
}: {
  statFields: SportStatField[];
  stats: Record<string, unknown>;
  decimals?: number;
  // Stat keys worth calling out for this player's position (e.g. BLOCK for a
  // middle blocker) — drawn with an accent ring instead of the plain card.
  highlightKeys?: string[];
}) {
  const present = statFields.filter((f) => stats[f.stat_key] !== undefined && stats[f.stat_key] !== null);
  const ranks = (stats.summaryRanks as Record<string, number> | undefined) ?? {};
  const highlighted = new Set(highlightKeys ?? []);

  if (present.length === 0) {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">기록된 스탯이 없어요.</p>;
  }

  return (
    <div className="flex w-fit divide-x divide-neutral-200 overflow-x-auto rounded-md bg-neutral-100 dark:divide-neutral-800 dark:bg-neutral-900">
      {present.map((field) => {
        const rank = ranks[field.stat_key];
        const isHighlighted = highlighted.has(field.stat_key);
        return (
          <div
            key={field.id}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2.5 ${
              isHighlighted ? "bg-amber-100/60 dark:bg-amber-900/20" : ""
            }`}
          >
            <p
              className={`whitespace-nowrap text-[11px] font-bold ${
                isHighlighted
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {field.label}
            </p>
            <p className="whitespace-nowrap text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {(() => {
                const v = stats[field.stat_key];
                if (typeof v !== "number") return String(v);
                // GP is a count, never averaged, so it never takes decimals even
                // when every other stat in this row does.
                if (field.stat_key === "GP") return String(v);
                const formatted = decimals != null ? v.toFixed(decimals) : String(v);
                return field.stat_key === "PM" && v > 0 ? `+${formatted}` : formatted;
              })()}
              {rank != null && <span className="ml-1 text-xs font-normal text-amber-600 dark:text-amber-400">({rank}위)</span>}
            </p>
          </div>
        );
      })}
    </div>
  );
}
