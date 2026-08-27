"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  type: "team" | "player";
  id: string;
  sportCode: string;
  label: string;
  sub: string | null;
};

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goTo(r: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(r.type === "team" ? `/${r.sportCode}/teams/${r.id}` : `/${r.sportCode}/players/${r.id}`);
  }

  return (
    <div ref={containerRef} className="relative ml-auto w-56">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const q = query.trim();
          if (!q) return;
          setOpen(false);
          router.push(`/search?q=${encodeURIComponent(q)}`);
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
          placeholder="선수 또는 팀 검색"
          className="w-full rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
        />
      </form>
      {open && results.length > 0 && (
        <ul className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <button
                type="button"
                onClick={() => goTo(r)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
              >
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{r.label}</span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {r.type === "team" ? "팀" : "선수"} · {r.sportCode.toUpperCase()}
                  {r.sub ? ` · ${r.sub}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
