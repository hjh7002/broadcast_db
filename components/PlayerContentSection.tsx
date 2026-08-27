"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerContent } from "@/lib/supabase/types";

function ContentItem({ item }: { item: PlayerContent }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [body, setBody] = useState(item.body);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/player-content/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("이 항목을 삭제할까요?")) return;
    await fetch(`/api/player-content/${item.id}`, { method: "DELETE" });
    router.refresh();
  }

  if (editing) {
    return (
      <article className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            취소
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="group relative rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <div className="absolute right-3 top-3 hidden gap-2 group-hover:flex">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-200"
        >
          수정
        </button>
        <button onClick={remove} className="text-xs text-neutral-400 hover:text-red-600 dark:text-neutral-500">
          삭제
        </button>
      </div>
      <h3 className="pr-16 font-medium">{item.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{item.body}</p>
      {item.source_urls.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-3 text-xs text-neutral-500 dark:text-neutral-400">
          {item.source_urls.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
                출처 ↗
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function PlayerContentSection({
  playerId,
  category,
  items,
}: {
  playerId: string;
  category: string;
  items: PlayerContent[];
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function add() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/player-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, category, title, body }),
      });
      setTitle("");
      setBody("");
      setAdding(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ContentItem key={item.id} item={item} />
      ))}

      {adding ? (
        <div className="rounded-lg border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="mb-2 w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="내용"
            className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={add}
              disabled={saving}
              className="rounded-md bg-neutral-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
            >
              {saving ? "저장 중..." : "추가"}
            </button>
            <button
              onClick={() => setAdding(false)}
              className="rounded-md px-3 py-1 text-xs text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="text-sm text-neutral-500 hover:text-neutral-800 hover:underline dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          + 항목 추가
        </button>
      )}
    </div>
  );
}
