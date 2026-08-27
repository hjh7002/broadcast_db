import { koreanNameForMlbTeamId } from "./mlbTeams";
import { koreanNameForKboCode } from "./kboTeams";

export type ScheduleGame = {
  sportCode: "mlb" | "kbo";
  awayName: string;
  homeName: string;
  timeLabel: string;
  status: string;
};

function toKstDateStr(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

export function todayKst(): string {
  return toKstDateStr(new Date());
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

async function getJson(url: string) {
  const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } });
  return res.json();
}

// MLB's schedule `date`/`startDate`/`endDate` params bucket games by their (roughly
// US-local) calendar date, which is usually one day behind the KST date evening games
// actually land on. So a wider window is fetched and each game is then re-filtered by
// its real UTC `gameDate` converted to KST, which is the only precise way to know
// which Korean calendar day it falls on.
export async function getTodayMlbGames(kstDate: string): Promise<ScheduleGame[]> {
  try {
    const startDate = addDays(kstDate, -2);
    const data = await getJson(
      `https://statsapi.mlb.com/api/v1/schedule?sportId=1&startDate=${startDate}&endDate=${kstDate}`,
    );
    const games: ScheduleGame[] = [];
    for (const dd of data.dates || []) {
      for (const g of dd.games || []) {
        const gd = new Date(g.gameDate);
        if (toKstDateStr(gd) !== kstDate) continue;
        const awayId = g.teams?.away?.team?.id;
        const homeId = g.teams?.home?.team?.id;
        if (!awayId || !homeId) continue;
        games.push({
          sportCode: "mlb",
          awayName: koreanNameForMlbTeamId(awayId),
          homeName: koreanNameForMlbTeamId(homeId),
          timeLabel: gd.toLocaleTimeString("ko-KR", {
            timeZone: "Asia/Seoul",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          status: g.status?.detailedState ?? "",
        });
      }
    }
    games.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
    return games;
  } catch {
    return [];
  }
}

export async function getTodayKboGames(kstDate: string): Promise<ScheduleGame[]> {
  try {
    const data = await getJson(
      `https://api-gw.sports.naver.com/schedule/games?fields=basic&fromDate=${kstDate}&toDate=${kstDate}&upperCategoryId=kbaseball&categoryId=kbo`,
    );
    // KBO plays entirely in Korea, so `gameDateTime` ("2026-08-25T18:30:00") is
    // already Korea wall-clock time with no offset suffix — just slice it directly
    // instead of running it through Date/timeZone conversion (which would assume UTC).
    const games: ScheduleGame[] = (data.result?.games || [])
      .filter((g: { cancel?: boolean }) => !g.cancel)
      .map((g: { awayTeamCode: string; homeTeamCode: string; gameDateTime?: string; statusInfo?: string }) => ({
        sportCode: "kbo" as const,
        awayName: koreanNameForKboCode(g.awayTeamCode),
        homeName: koreanNameForKboCode(g.homeTeamCode),
        timeLabel: (g.gameDateTime || "").slice(11, 16),
        status: g.statusInfo ?? "",
      }));
    games.sort((a, b) => a.timeLabel.localeCompare(b.timeLabel));
    return games;
  } catch {
    return [];
  }
}

export async function getTodayGames(): Promise<{ kstDate: string; mlb: ScheduleGame[]; kbo: ScheduleGame[] }> {
  const kstDate = todayKst();
  const [mlb, kbo] = await Promise.all([getTodayMlbGames(kstDate), getTodayKboGames(kstDate)]);
  return { kstDate, mlb, kbo };
}
