"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReactivateBroadcastButton({ broadcastId }: { broadcastId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleReactivate() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: broadcastId, reactivate: true }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleReactivate}
      disabled={pending}
      className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
    >
      {pending ? "여는 중..." : "다시 켜기"}
    </button>
  );
}
