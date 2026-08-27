import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import { search } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query.length > 0 ? await search(query) : [];

  return (
    <div>
      <div className="mb-6 max-w-md">
        <SearchBox initialQuery={query} />
      </div>
      {query.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">선수나 팀 이름을 검색해보세요.</p>
      ) : results.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          &quot;{query}&quot;에 대한 검색 결과가 없어요.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
          {results.map((r) => (
            <li key={`${r.type}-${r.id}`}>
              <Link
                href={r.type === "team" ? `/${r.sportCode}/teams/${r.id}` : `/${r.sportCode}/players/${r.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{r.label}</span>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {r.type === "team" ? "팀" : "선수"} · {r.sportCode.toUpperCase()}
                  {r.sub ? ` · ${r.sub}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
