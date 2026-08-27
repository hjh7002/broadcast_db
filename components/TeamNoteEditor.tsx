"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamNoteEditor({
  broadcastId,
  side,
  initialNote,
}: {
  broadcastId: string;
  side: "home" | "away";
  initialNote: string;
}) {
  const [value, setValue] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const router = useRouter();

  async function save() {
    if (value === initialNote) return;
    setSaving(true);
    try {
      await fetch("/api/broadcast", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: broadcastId,
          [side === "home" ? "home_note" : "away_note"]: value || null,
        }),
      });
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col border-t border-neutral-200 p-3 dark:border-neutral-800">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder="메모를 입력하세요..."
        className="min-h-[16rem] flex-1 resize-none rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
      />
      <div className="mt-1 h-4 text-right text-xs text-neutral-400 dark:text-neutral-500">
        {saving ? "저장 중..." : savedAt ? "저장됨" : ""}
      </div>
    </div>
  );
}
