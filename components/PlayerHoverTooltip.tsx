"use client";

import { useRef, useState } from "react";
import type { Player } from "@/lib/supabase/types";

// Hover (laptop/mouse only — no click) reveals the player's memo after a
// short dwell, so a caster can peek context without the click a full
// PlayerFloatingCard needs. Memo is what matters live, not the stat averages
// already visible in the row, so that's the only thing shown here.
const HOVER_DELAY_MS = 450;

export default function PlayerHoverTooltip({ player, children }: { player: Player; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bio = (player.bio as Record<string, unknown>) ?? {};
  const memo = typeof bio.memo === "string" && bio.memo.length > 0 ? bio.memo : null;
  // Structured injury/absence flag (e.g. "부상으로 대회 제외") — kept separate
  // from `memo` free text so it can render as its own line, below the memo
  // since memo is the priority content, not above it.
  const status = typeof bio.status === "string" && bio.status.length > 0 ? bio.status : null;

  const handleEnter = () => {
    if (!memo && !status) return;
    timerRef.current = setTimeout(() => setShow(true), HOVER_DELAY_MS);
  };
  const handleLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShow(false);
  };

  if (!memo && !status) return <>{children}</>;

  return (
    <span className="relative inline-block" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {show && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 max-w-[80vw] rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs leading-relaxed text-neutral-700 shadow-lg dark:border-amber-900 dark:bg-amber-950/95 dark:text-neutral-200">
            {memo && <p className="whitespace-pre-wrap">{memo}</p>}
            {status && (
              <p className={`whitespace-pre-wrap font-medium text-red-600 dark:text-red-400 ${memo ? "mt-1.5 border-t border-amber-200 pt-1.5 dark:border-amber-900" : ""}`}>
                ⚠ {status}
              </p>
            )}
        </div>
      )}
    </span>
  );
}
