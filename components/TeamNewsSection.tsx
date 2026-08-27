"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type TeamNewsItem = {
  id: string;
  title: string;
  body: string;
  date?: string;
};

function todayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}

function NewsItemRow({ item, onChange }: { item: TeamNewsItem; onChange: (next: TeamNewsItem[] | null) => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("이 소식을 삭제할까요?")) return;
    setBusy(true);
    try {
      await onChange(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="group relative rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <button
        onClick={remove}
        disabled={busy}
        className="absolute right-3 top-3 hidden text-xs text-neutral-400 hover:text-red-600 group-hover:block dark:text-neutral-500"
      >
        삭제
      </button>
      <div className="flex items-baseline gap-2 pr-10">
        <h3 className="font-medium">{item.title}</h3>
        {item.date && <span className="text-xs text-neutral-400 dark:text-neutral-500">{item.date}</span>}
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{item.body}</p>
    </article>
  );
}

export default function TeamNewsSection({
  teamId,
  initialNews,
}: {
  teamId: string;
  initialNews: TeamNewsItem[];
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const news = [...initialNews].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  async function persist(next: TeamNewsItem[]) {
    await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ extra: { news: next } }),
    });
    router.refresh();
  }

  async function add() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const item: TeamNewsItem = { id: crypto.randomUUID(), title, body, date: date || undefined };
      await persist([...initialNews, item]);
      setTitle("");
      setBody("");
      setDate(todayStr());
      setAdding(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeItem(id: string) {
    await persist(initialNews.filter((n) => n.id !== id));
  }

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
      >
        팀 뉴스 {news.length > 0 && `(${news.length})`}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {news.length === 0 && !adding && (
            <p className="text-sm text-neutral-400 dark:text-neutral-500">등록된 소식이 없어요.</p>
          )}

          {news.map((item) => (
            <NewsItemRow key={item.id} item={item} onChange={() => removeItem(item.id)} />
          ))}

          {adding ? (
            <div className="rounded-lg border border-dashed border-neutral-300 px-4 py-3 dark:border-neutral-700">
              <div className="mb-2 flex gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="flex-1 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
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
              + 소식 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
