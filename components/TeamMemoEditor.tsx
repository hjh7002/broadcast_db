"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeamMemoEditor({
  teamId,
  initialMemo,
}: {
  teamId: string;
  initialMemo: string;
}) {
  const [value, setValue] = useState(initialMemo);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const router = useRouter();

  async function save() {
    if (value === initialMemo) return;
    setSaving(true);
    try {
      await fetch(`/api/teams/${teamId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extra: { memo: value || null } }),
      });
      setSavedAt(Date.now());
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder="메모를 입력하세요... (중계 중 참고할 내용 등)"
        rows={12}
        className="w-full resize-y rounded-md border border-amber-200 bg-white p-2.5 text-sm text-neutral-900 outline-none focus:border-amber-400 dark:border-amber-800 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-amber-600"
      />
      <div className="mt-1 h-4 text-right text-xs text-neutral-400 dark:text-neutral-500">
        {saving ? "저장 중..." : savedAt ? "저장됨" : ""}
      </div>
    </div>
  );
}
