"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MIN_HEIGHT = 80;
const MAX_HEIGHT = 800;

export default function TeamNoteEditor({
  broadcastId,
  side,
  initialNote,
  fillHeight,
}: {
  broadcastId: string;
  side: "home" | "away";
  initialNote: string;
  // Baseball's memo area is already sized by the parent (flex-[3] of a fixed-height
  // card) — stretching the textarea to fill that with CSS means it's always at the
  // biggest size the layout allows, with nothing to reset on reload. The drag handle
  // below is for contexts (basketball) where the parent doesn't pre-allocate space.
  fillHeight?: boolean;
}) {
  const [value, setValue] = useState(initialNote);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [height, setHeight] = useState(128);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);
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

  function onDragMove(e: MouseEvent) {
    if (!dragRef.current) return;
    const delta = e.clientY - dragRef.current.startY;
    const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragRef.current.startHeight + delta));
    setHeight(next);
  }

  function onDragEnd() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
  }

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startHeight: height };
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }

  if (fillHeight) {
    return (
      <div className="flex h-full flex-col border-t border-neutral-200 p-3 dark:border-neutral-800">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          placeholder="메모를 입력하세요..."
          className="w-full min-h-0 flex-1 resize-none rounded-md border border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
        />
        <div className="mt-1 h-4 shrink-0 text-right text-xs text-neutral-400 dark:text-neutral-500">
          {saving ? "저장 중..." : savedAt ? "저장됨" : ""}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col border-t border-neutral-200 p-3 dark:border-neutral-800">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder="메모를 입력하세요..."
        style={{ height }}
        className="w-full resize-none rounded-t-md border border-b-0 border-neutral-300 bg-white p-3 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
      />
      <div
        onMouseDown={onDragStart}
        title="드래그해서 크기 조절"
        className="flex h-3 shrink-0 cursor-ns-resize items-center justify-center rounded-b-md border border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
      >
        <div className="h-0.5 w-8 rounded-full bg-neutral-400 dark:bg-neutral-500" />
      </div>
      <div className="mt-1 h-4 text-right text-xs text-neutral-400 dark:text-neutral-500">
        {saving ? "저장 중..." : savedAt ? "저장됨" : ""}
      </div>
    </div>
  );
}
