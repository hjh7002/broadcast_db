import type { PlayerContent } from "@/lib/supabase/types";

const CATEGORY_LABEL: Record<string, string> = {
  episode: "에피소드",
  background: "선수 정보",
  stat_record: "기록의 의미",
};

export default function PlayerContentList({ content }: { content: PlayerContent[] }) {
  if (content.length === 0) return null;

  return (
    <div className="mt-8">
      <p className="mb-3 text-base font-semibold">선수 노트</p>
      <div className="space-y-4">
        {content.map((c) => (
          <div key={c.id} className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                {CATEGORY_LABEL[c.category] ?? c.category}
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{c.title}</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
              {c.body}
            </p>
            {c.source_urls.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                {c.source_urls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    출처
                  </a>
                ))}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
