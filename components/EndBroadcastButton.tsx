"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EndBroadcastButton({ broadcastId }: { broadcastId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleEnd() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: broadcastId, end: true }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleEnd}
      disabled={pending}
      aria-label="오늘의 중계 종료"
      title="오늘의 중계 종료 (나중에 다시 켤 수 있어요)"
      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
    >
      ✕
    </button>
  );
}
