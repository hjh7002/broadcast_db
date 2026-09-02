"use client";

import { useState } from "react";

export type WorldCupNewsItem = {
  title: string;
  date: string;
  url: string;
  summary: string;
  full_summary?: string;
};

function NewsRow({ item }: { item: WorldCupNewsItem }) {
  const [open, setOpen] = useState(false);
  const hasMore = Boolean(item.full_summary);

  return (
    <li className="px-4 py-3">
      <button
        type="button"
        onClick={() => hasMore && setOpen((v) => !v)}
        className={`block w-full text-left ${hasMore ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {item.title}
          {hasMore && (
            <span className="ml-1.5 text-xs font-normal text-neutral-400 dark:text-neutral-500">
              {open ? "▲ 요약 닫기" : "▼ 자세히 보기"}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{item.date} · FIBA Basketball</p>
        <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">{item.summary}</p>
      </button>
      {open && item.full_summary && (
        <div className="mt-3 rounded-md bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          <p className="whitespace-pre-line">{item.full_summary}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            원문 보기 (FIBA Basketball) →
          </a>
        </div>
      )}
    </li>
  );
}

export default function WorldCupNewsList({ news, title }: { news: WorldCupNewsItem[]; title: string }) {
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {news.map((n) => (
          <NewsRow key={n.url} item={n} />
        ))}
      </ul>
    </div>
  );
}
