import Link from "next/link";
import { notFound } from "next/navigation";
import { getSportByCode, getTeamsForSport } from "@/lib/data";
import WorldCupNewsList, { type WorldCupNewsItem } from "@/components/WorldCupNewsList";

export const dynamic = "force-dynamic";

type GroupStanding = {
  rank: number;
  code: string;
  name_ko: string;
  wins: number;
  losses: number;
  points: number;
  // Optional deep link for the team name — internal team page if we have one,
  // otherwise an external link (e.g. to FIBA's own team page) when we don't.
  team_url?: string;
  team_url_external?: boolean;
};
type OtherGroup = { group: string; teams: { code: string; name_ko: string; url: string }[] };

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
                {s.team_url ? (
                  s.team_url_external ? (
                    <a href={s.team_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {s.name_ko}
                    </a>
                  ) : (
                    <Link href={s.team_url} className="hover:underline">
                      {s.name_ko}
                    </Link>
                  )
                ) : (
                  s.name_ko
                )}{" "}
                <span className="text-xs text-neutral-400 dark:text-neutral-500">{s.code}</span>
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

function OtherGroupsSection({ groups }: { groups: OtherGroup[] }) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {groups.map((g) => (
        <div key={g.group} className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
          <h3 className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">{g.group}조</h3>
          <ul className="space-y-1">
            {g.teams.map((t) => (
              <li key={t.code}>
                <a
                  href={t.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-700 hover:underline dark:text-neutral-300"
                >
                  {t.name_ko} <span className="text-xs text-neutral-400 dark:text-neutral-500">{t.code}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
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
  const groupNews = extra.group_news as WorldCupNewsItem[] | undefined;
  const groupName = extra.group as string | undefined;
  const otherGroups = extra.other_groups as OtherGroup[] | undefined;
  const titleOverride = extra.title_override as string | undefined;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">{titleOverride ?? `${sport.name} 팀 목록`}</h1>

      {groupStandings && groupStandings.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-medium">{groupName ? `${groupName}조 순위` : "조 순위"}</h2>
          <GroupStandingsTable standings={groupStandings} />
        </div>
      )}

      {otherGroups && otherGroups.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-medium">다른 조 (로스터 발표 전)</h2>
          <OtherGroupsSection groups={otherGroups} />
        </div>
      )}

      {otherGroups && otherGroups.length > 0 ? null : teams.length === 0 ? (
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

      {groupNews && groupNews.length > 0 && (
        <WorldCupNewsList news={groupNews} title={(extra.news_heading as string | undefined) ?? "관련 뉴스"} />
      )}
    </div>
  );
}
