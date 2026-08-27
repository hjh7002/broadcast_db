import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportByCode, getTeamsForSport } from "@/lib/data";

export const dynamic = "force-dynamic";

type GroupStanding = { rank: number; code: string; name_ko: string; wins: number; losses: number; points: number };
type GroupNewsItem = { title: string; date: string; url: string; summary?: string };

function GroupStandingsTable({ standings }: { standings: GroupStanding[] }) {
  return (
    <div className="mb-8 overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="bg-neutral-50 text-xs text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium">순위</th>
            <th className="px-3 py-2 font-medium">국가</th>
            <th className="px-3 py-2 font-medium">승</th>
            <th className="px-3 py-2 font-medium">패</th>
            <th className="px-3 py-2 font-medium">승점</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
          {standings.map((s) => (
            <tr key={s.code} className={s.code === "KOR" ? "bg-blue-50 dark:bg-blue-950/40" : undefined}>
              <td className="px-3 py-2">{s.rank}</td>
              <td className="px-3 py-2 font-medium text-neutral-900 dark:text-neutral-100">
                {s.name_ko} <span className="text-xs text-neutral-400 dark:text-neutral-500">{s.code}</span>
              </td>
              <td className="px-3 py-2">{s.wins}</td>
              <td className="px-3 py-2">{s.losses}</td>
              <td className="px-3 py-2 font-medium">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupNewsList({ news }: { news: GroupNewsItem[] }) {
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-lg font-medium">관련 뉴스</h2>
      <ul className="divide-y divide-neutral-200 overflow-hidden rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {news.map((n) => (
          <li key={n.url} className="px-4 py-3">
            <a
              href={n.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-neutral-900 hover:underline dark:text-neutral-100"
            >
              {n.title}
            </a>
            <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{n.date} · FIBA Basketball</p>
            {n.summary && (
              <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-300">{n.summary}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SportPage({
  params,
}: {
  params: Promise<{ sportCode: string }>;
}) {
  const { sportCode } = await params;
  const sport = await getSportByCode(sportCode);
  if (!sport) notFound();
  const teams = await getTeamsForSport(sport.id);

  // Group-stage standings/news (currently only populated for 농구 국가대표) live in
  // any team's `extra` jsonb — no dedicated table, see scripts/patchGroupFStandingsNews.js.
  const teamWithGroupData = teams.find((t) => {
    const extra = t.extra as Record<string, unknown>;
    return Array.isArray(extra?.group_standings);
  });
  const extra = (teamWithGroupData?.extra as Record<string, unknown>) ?? {};
  const groupStandings = extra.group_standings as GroupStanding[] | undefined;
  const groupNews = extra.group_news as GroupNewsItem[] | undefined;
  const groupName = extra.group as string | undefined;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{sport.name} 팀 목록</h1>

      {groupStandings && groupStandings.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-medium">{groupName ? `${groupName}조 순위` : "조 순위"}</h2>
          <GroupStandingsTable standings={groupStandings} />
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          등록된 팀이 없어요. 챗봇에게 &quot;{sport.name}에 OO팀 추가해줘&quot;라고 말해보세요.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {teams.map((team) => (
            <li key={team.id}>
              <Link
                href={`/${sport.code}/teams/${team.id}`}
                className="block rounded-lg border border-neutral-200 px-4 py-3 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
              >
                <div className="font-medium text-neutral-900 dark:text-neutral-100">{team.name}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {groupNews && groupNews.length > 0 && <GroupNewsList news={groupNews} />}
    </div>
  );
}
