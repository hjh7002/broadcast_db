"use client";

import { useEffect, useRef, useState } from "react";

type CuratedContent = { playerId: string; name: string; content: { category: string; title: string; body: string }[] } | null;

type SeasonHighs = {
  strikeOuts: { value: number; date: string; opponent: string };
  baseOnBalls: { value: number; date: string; opponent: string };
  homeRuns: { value: number; date: string; opponent: string };
} | null;

type PitcherVsTeamLine = { games: number; wins: number; losses: number; era: string };
type BatterVsTeamLine = { games: number; avg: string; ops: string; hr: number; rbi: number };

type Affiliations = {
  pitcherPlayedForBatterTeam: number[];
  batterPlayedForPitcherTeam: number[];
  wereTeammates: { teamId: number; teamName: string; seasons: number[] }[];
} | null;

type SbDefenseLine = {
  season: { cs: number; attempts: number; pct: number } | null;
  career: { cs: number; attempts: number; pct: number } | null;
};

type RunnerSplitLine = { label: string; avg: string; ab: number; hits: number };
type BasesLoadedStat = {
  season: { ab: number; hits: number; avg: string; grandSlams: number };
  career: { ab: number; hits: number; avg: string; grandSlams: number };
} | null;

type PitcherInfo = {
  id: number;
  name: string;
  side: "home" | "away";
  handSplits: { label: string; avg: string }[];
  curated: CuratedContent;
  seasonHighs: SeasonHighs;
  vsOpponentTeam: { career: PitcherVsTeamLine; season: PitcherVsTeamLine } | null;
  opponentTeamName: string;
  notableFacts: string[];
  pitchMix: { type: string; typeKo: string; usage: string; velo: string; ba: string; hr: number; whiff: string }[] | null;
  recentBullpenOutings: string[];
  stolenBaseDefense: {
    pitcher: SbDefenseLine | null;
    catcher: (SbDefenseLine & { name: string }) | null;
  };
  runnerSplits: RunnerSplitLine[];
  basesLoadedStat: BasesLoadedStat;
};

type BatterInfo = {
  id: number;
  name: string;
  side: "home" | "away";
  matchupHistory: {
    career: { ab: number; hits: number; avg: string; hr: number; bb: number; so: number } | null;
    seasonApprox: { games: number; ab: number; hits: number; avg: string; hr: number } | null;
  } | null;
  series: {
    ab: number; hits: number; doubles: number; triples: number; hr: number; bb: number; sb: number; gidp: number;
    games: number; isPrevious: boolean; opponentId: number | null; opponentName?: string | null;
  } | null;
  streak: {
    type: "hit" | "hitless";
    games: number;
    ab: number;
    hits: number;
    hr: number;
    bb: number;
    hbp: number;
    avg: string;
    ops: string;
  } | null;
  onBaseStreak: { games: number; ab: number; hits: number; bb: number; hbp: number; avg: string } | null;
  pitchCategoryAvg: { label: string; avg: string }[] | null;
  curated: CuratedContent;
  vsOpponentTeam: { career: BatterVsTeamLine; season: BatterVsTeamLine } | null;
  opponentTeamName: string;
  affiliations: Affiliations;
  notableFacts: string[];
  handSplits: { label: string; avg: string }[];
  runnerSplits: RunnerSplitLine[];
  basesLoadedStat: BasesLoadedStat;
};

type MatchupData = {
  status: string;
  isLive: boolean;
  inning: number | null;
  halfInning: string | null;
  outs: number | null;
  balls: number | null;
  strikes: number | null;
  linescore: { home: { runs: number; hits: number }; away: { runs: number; hits: number } } | null;
  probablePitchers: { away?: { fullName: string }; home?: { fullName: string } } | null;
  updatedAt?: string;
  pitcher?: PitcherInfo;
  batter?: BatterInfo | null;
  recentHomeRuns?: { playId: string; batterName: string; ballparks: number; inning: number; halfInning: string; exitVelo: string; distance: string }[];
  defensiveHighlight?: {
    playId: string;
    batterName: string;
    fielderName: string;
    position: string;
    xba: string;
    isOut: boolean;
    oaa: number | null;
  } | null;
  runners?: { name: string; sbPct: string | null; sprintSpeed: number | null }[];
};

const CATEGORY_LABELS: Record<string, string> = { episode: "에피소드", background: "선수 정보", stat_record: "기록의 의미" };

type NewsItem = { key: string; text: string; ts: number };

function NewsTicker({ items, onDismiss }: { items: NewsItem[]; onDismiss: (key: string) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-900 dark:bg-amber-950">
      {items.map((item) => (
        <div key={item.key} className="flex items-start gap-2 text-xs">
          <span className="mt-0.5 shrink-0 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">NEWS</span>
          <span className="flex-1 text-amber-900 dark:text-amber-200">{item.text}</span>
          <button
            type="button"
            onClick={() => onDismiss(item.key)}
            aria-label="닫기"
            className="shrink-0 text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
      <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{children}</div>
    </div>
  );
}

function CuratedList({ curated }: { curated: CuratedContent }) {
  if (!curated || curated.content.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      {curated.content.map((c, i) => (
        <div key={i} className="rounded-lg bg-neutral-50 p-2 text-xs dark:bg-neutral-900">
          <p className="mb-0.5 font-medium text-neutral-600 dark:text-neutral-300">
            [{CATEGORY_LABELS[c.category] ?? c.category}] {c.title}
          </p>
          <p className="text-neutral-500 dark:text-neutral-400">{c.body}</p>
        </div>
      ))}
    </div>
  );
}

function PitcherCard({ p, runners }: { p: PitcherInfo; runners?: { name: string; sbPct: string | null; sprintSpeed: number | null }[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">투수 · {p.name}</p>
      <div className="grid grid-cols-2 gap-2">
        {p.handSplits.map((c) => (
          <Card key={c.label} label={c.label}>{c.avg}</Card>
        ))}
      </div>
      {p.runnerSplits.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {p.runnerSplits.map((c) => (
            <Card key={c.label} label={c.label}>{c.avg}({c.hits}-{c.ab})</Card>
          ))}
        </div>
      )}
      {p.basesLoadedStat && (
        <div className="mt-2">
          <Card label="만루 피안타율">
            시즌 {p.basesLoadedStat.season.hits}-{p.basesLoadedStat.season.ab}, {p.basesLoadedStat.season.avg}
            {p.basesLoadedStat.season.grandSlams > 0 ? ` (만루홈런 ${p.basesLoadedStat.season.grandSlams})` : ""}
            {" | "}
            통산 {p.basesLoadedStat.career.hits}-{p.basesLoadedStat.career.ab}, {p.basesLoadedStat.career.avg}
            {p.basesLoadedStat.career.grandSlams > 0 ? ` (만루홈런 ${p.basesLoadedStat.career.grandSlams})` : ""}
          </Card>
        </div>
      )}
      {p.recentBullpenOutings.length > 0 && (
        <div className="mt-2">
          <Card label="최근 7일 등판">
            {p.recentBullpenOutings.map((line, i) => (
              <span key={i} className="block">{line}</span>
            ))}
          </Card>
        </div>
      )}
      {p.vsOpponentTeam && (
        <div className="mt-2">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">{p.opponentTeamName} 상대 전적</p>
          <div className="grid grid-cols-2 gap-2">
            <Card label="이번 시즌 (경기/승-패/ERA)">
              {p.vsOpponentTeam.season.games}경기 {p.vsOpponentTeam.season.wins}승{p.vsOpponentTeam.season.losses}패 · ERA {p.vsOpponentTeam.season.era}
            </Card>
            <Card label="통산 (경기/승-패/ERA)">
              {p.vsOpponentTeam.career.games}경기 {p.vsOpponentTeam.career.wins}승{p.vsOpponentTeam.career.losses}패 · ERA {p.vsOpponentTeam.career.era}
            </Card>
          </div>
        </div>
      )}
      {p.pitchMix && p.pitchMix.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">구종 분석</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                  <th className="py-1.5 pr-3 font-normal">구종</th>
                  <th className="py-1.5 pr-3 font-normal">구사비율</th>
                  <th className="py-1.5 pr-3 font-normal">구속</th>
                  <th className="py-1.5 pr-3 font-normal">피안타율</th>
                  <th className="py-1.5 pr-3 font-normal">피홈런</th>
                  <th className="py-1.5 pr-3 font-normal">Whiff%</th>
                </tr>
              </thead>
              <tbody>
                {p.pitchMix.map((row) => (
                  <tr key={row.type} className="border-b border-neutral-100 dark:border-neutral-900">
                    <td className="py-1.5 pr-3 font-medium">{row.typeKo}</td>
                    <td className="py-1.5 pr-3">{row.usage}</td>
                    <td className="py-1.5 pr-3">{row.velo}</td>
                    <td className="py-1.5 pr-3">{row.ba}</td>
                    <td className="py-1.5 pr-3">{row.hr}</td>
                    <td className="py-1.5 pr-3">{row.whiff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {(p.stolenBaseDefense.pitcher || p.stolenBaseDefense.catcher) && (
        <div className="mt-3">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">도루 저지</p>
          <div className="grid grid-cols-2 gap-2">
            {p.stolenBaseDefense.pitcher && (
              <Card label="투수">
                {p.stolenBaseDefense.pitcher.season
                  ? `시즌 ${p.stolenBaseDefense.pitcher.season.pct}%(${p.stolenBaseDefense.pitcher.season.cs}/${p.stolenBaseDefense.pitcher.season.attempts})`
                  : "시즌 -"}
                {" | "}
                {p.stolenBaseDefense.pitcher.career
                  ? `통산 ${p.stolenBaseDefense.pitcher.career.pct}%(${p.stolenBaseDefense.pitcher.career.cs}/${p.stolenBaseDefense.pitcher.career.attempts})`
                  : "통산 -"}
              </Card>
            )}
            {p.stolenBaseDefense.catcher && (
              <Card label={`포수 · ${p.stolenBaseDefense.catcher.name}`}>
                {p.stolenBaseDefense.catcher.season
                  ? `시즌 ${p.stolenBaseDefense.catcher.season.pct}%(${p.stolenBaseDefense.catcher.season.cs}/${p.stolenBaseDefense.catcher.season.attempts})`
                  : "시즌 -"}
                {" | "}
                {p.stolenBaseDefense.catcher.career
                  ? `통산 ${p.stolenBaseDefense.catcher.career.pct}%(${p.stolenBaseDefense.catcher.career.cs}/${p.stolenBaseDefense.catcher.career.attempts})`
                  : "통산 -"}
              </Card>
            )}
            {runners && runners.length > 0 && runners.map((r) => (
              <Card key={r.name} label={`주자 · ${r.name}`}>
                SB {r.sbPct ?? "-"} | {r.sprintSpeed != null ? `${r.sprintSpeed}ft/s` : "-"}
              </Card>
            ))}
          </div>
        </div>
      )}
      <CuratedList curated={p.curated} />
    </div>
  );
}

function formatSeriesLine(s: NonNullable<BatterInfo["series"]>): string {
  const parts: string[] = [];
  if (s.doubles > 0) parts.push(`${s.doubles}-2루타`);
  if (s.triples > 0) parts.push(`${s.triples}-3루타`);
  if (s.hr > 0) parts.push(`${s.hr}홈런`);
  if (s.bb > 0) parts.push(`${s.bb}볼넷`);
  if (s.sb > 0) parts.push(`${s.sb}도루`);
  if (s.gidp > 0) parts.push(`${s.gidp}병살`);
  return `${s.games}경기 ${s.ab}타수 ${s.hits}안타${parts.length > 0 ? " " + parts.join(", ") : ""}`;
}

function BatterCard({ b }: { b: BatterInfo }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">타자 · {b.name}</p>
      {b.matchupHistory?.seasonApprox && (
        <div className="mb-2">
          <Card label="이 투수 상대 이번 시즌(근사치)">
            {b.matchupHistory.seasonApprox.hits}-{b.matchupHistory.seasonApprox.ab}, {b.matchupHistory.seasonApprox.avg} {b.matchupHistory.seasonApprox.hr}홈런
          </Card>
        </div>
      )}
      {(b.matchupHistory || b.series) && (
        <div className="mb-2">
          <Card
            label={`투수 상대 전적${
              b.series ? (b.series.isPrevious ? ` · 직전 시리즈(vs ${b.series.opponentName})` : " · 이번 시리즈") : ""
            }`}
          >
            {b.matchupHistory
              ? b.matchupHistory.career
                ? `${b.matchupHistory.career.hits}-${b.matchupHistory.career.ab}, ${b.matchupHistory.career.avg} ${b.matchupHistory.career.hr}홈런 ${b.matchupHistory.career.bb}볼넷 ${b.matchupHistory.career.so}삼진`
                : "0-0 (첫 상대)"
              : null}
            {b.matchupHistory && b.series ? " | " : ""}
            {b.series ? formatSeriesLine(b.series) : ""}
          </Card>
        </div>
      )}
      {b.streak && (
        <div className="mb-2">
          <Card label={b.streak.type === "hit" ? "연속안타" : "연속무안타"}>
            {b.streak.games}경기({b.streak.hits}-{b.streak.ab}, {b.streak.avg}/{b.streak.ops} {b.streak.hr}홈런
            {b.streak.type === "hitless" && (b.streak.bb > 0 || b.streak.hbp > 0)
              ? `, ${[b.streak.bb > 0 ? `${b.streak.bb}볼넷` : null, b.streak.hbp > 0 ? `${b.streak.hbp}사구` : null]
                  .filter(Boolean)
                  .join(" ")}`
              : ""}
            )
            {b.streak.type === "hit" && b.onBaseStreak && b.onBaseStreak.games === b.streak.games && " (연속출루와 동일)"}
            {b.streak.type === "hit" && b.onBaseStreak && b.onBaseStreak.games > b.streak.games &&
              ` | 연속출루 ${b.onBaseStreak.games}경기(${b.onBaseStreak.ab}타수 ${b.onBaseStreak.hits}안타${b.onBaseStreak.bb > 0 ? ` ${b.onBaseStreak.bb}볼넷` : ""}${b.onBaseStreak.hbp > 0 ? ` ${b.onBaseStreak.hbp}사구` : ""}, ${b.onBaseStreak.avg})`}
          </Card>
        </div>
      )}
      {(!b.streak || b.streak.type === "hitless") && b.onBaseStreak && (
        <div className="mb-2">
          <Card label="연속출루">
            {b.onBaseStreak.games}경기({b.onBaseStreak.ab}타수 {b.onBaseStreak.hits}안타
            {b.onBaseStreak.bb > 0 ? ` ${b.onBaseStreak.bb}볼넷` : ""}
            {b.onBaseStreak.hbp > 0 ? ` ${b.onBaseStreak.hbp}사구` : ""}, {b.onBaseStreak.avg})
          </Card>
        </div>
      )}
      {b.vsOpponentTeam && (
        <div className="mb-2">
          <p className="mb-1 text-xs text-neutral-500 dark:text-neutral-400">{b.opponentTeamName} 상대 전적</p>
          <div className="grid grid-cols-2 gap-2">
            <Card label="이번 시즌 (경기/타율/OPS/홈런/타점)">
              {b.vsOpponentTeam.season.games}경기 {b.vsOpponentTeam.season.avg} · OPS {b.vsOpponentTeam.season.ops} · {b.vsOpponentTeam.season.hr}홈런 {b.vsOpponentTeam.season.rbi}타점
            </Card>
            <Card label="통산 (경기/타율/OPS/홈런/타점)">
              {b.vsOpponentTeam.career.games}경기 {b.vsOpponentTeam.career.avg} · OPS {b.vsOpponentTeam.career.ops} · {b.vsOpponentTeam.career.hr}홈런 {b.vsOpponentTeam.career.rbi}타점
            </Card>
          </div>
        </div>
      )}
      {b.affiliations && (b.affiliations.pitcherPlayedForBatterTeam.length > 0 || b.affiliations.batterPlayedForPitcherTeam.length > 0 || b.affiliations.wereTeammates.length > 0) && (
        <div className="mb-2 space-y-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {b.affiliations.pitcherPlayedForBatterTeam.length > 0 && (
            <p>· 상대 투수가 {b.opponentTeamName}(타자 소속팀) 소속이었던 적 있음: {b.affiliations.pitcherPlayedForBatterTeam.join(", ")}년</p>
          )}
          {b.affiliations.batterPlayedForPitcherTeam.length > 0 && (
            <p>· 이 타자가 상대 투수의 소속팀에서 뛴 적 있음: {b.affiliations.batterPlayedForPitcherTeam.join(", ")}년</p>
          )}
          {b.affiliations.wereTeammates.map((t) => (
            <p key={t.teamId}>· 두 선수 모두 {t.teamName} 소속이었던 적 있음: {t.seasons.join(", ")}년</p>
          ))}
        </div>
      )}
      {b.handSplits.length > 0 && (
        <div className="mb-2 grid grid-cols-2 gap-2">
          {b.handSplits.map((c) => (
            <Card key={c.label} label={c.label}>{c.avg}</Card>
          ))}
        </div>
      )}
      {b.runnerSplits.length > 0 && (
        <div className="mb-2 grid grid-cols-4 gap-2">
          {b.runnerSplits.map((c) => (
            <Card key={c.label} label={c.label}>{c.avg}({c.hits}-{c.ab})</Card>
          ))}
        </div>
      )}
      {b.basesLoadedStat && (
        <div className="mb-2">
          <Card label="만루 타율">
            시즌 {b.basesLoadedStat.season.hits}-{b.basesLoadedStat.season.ab}, {b.basesLoadedStat.season.avg}
            {b.basesLoadedStat.season.grandSlams > 0 ? ` (만루홈런 ${b.basesLoadedStat.season.grandSlams})` : ""}
            {" | "}
            통산 {b.basesLoadedStat.career.hits}-{b.basesLoadedStat.career.ab}, {b.basesLoadedStat.career.avg}
            {b.basesLoadedStat.career.grandSlams > 0 ? ` (만루홈런 ${b.basesLoadedStat.career.grandSlams})` : ""}
          </Card>
        </div>
      )}
      {b.pitchCategoryAvg && b.pitchCategoryAvg.length > 0 && (
        <div className="mb-2 grid grid-cols-3 gap-2">
          {b.pitchCategoryAvg.map((c) => (
            <Card key={c.label} label={`${c.label} 타율`}>{c.avg}</Card>
          ))}
        </div>
      )}
      <CuratedList curated={b.curated} />
    </div>
  );
}

function SideSlot({ side, data }: { side: "home" | "away"; data: MatchupData | null }) {
  if (!data) return null;
  const player = data.pitcher?.side === side ? { kind: "pitcher" as const, v: data.pitcher } : data.batter?.side === side ? { kind: "batter" as const, v: data.batter } : null;

  if (!player) {
    return (
      <div className="flex-1 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">표시할 실시간 정보가 없어요.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      {player.kind === "pitcher" ? <PitcherCard p={player.v} runners={data.runners} /> : <BatterCard b={player.v} />}
    </div>
  );
}

export default function LiveMatchupPanel({
  awayTeamMlbId,
  homeTeamMlbId,
  overrideGamePk,
}: {
  awayTeamMlbId: number;
  homeTeamMlbId: number;
  overrideGamePk?: number;
}) {
  const [data, setData] = useState<MatchupData | { status: "no_game" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  // Persisted to sessionStorage (not just state) so a dismissed item stays hidden even
  // across a page reload or a dev Fast Refresh remount during this browser tab's session.
  const DISMISSED_STORAGE_KEY = "live-matchup-dismissed-news";
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.sessionStorage.getItem(DISMISSED_STORAGE_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });
  // Mirrors `dismissedKeys` for the polling effect below, which reads it on every 15s
  // tick without wanting `dismissedKeys` in its dependency array (that would tear down
  // and restart the interval on every dismiss). Refs always read the live value, so this
  // side-steps the stale-closure problem a plain useState capture would have there.
  const dismissedKeysRef = useRef<Set<string>>(dismissedKeys);
  useEffect(() => {
    dismissedKeysRef.current = dismissedKeys;
  }, [dismissedKeys]);

  function dismissNews(key: string) {
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      try {
        window.sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...next]));
      } catch { /* ignore */ }
      return next;
    });
    setNewsItems((prev) => prev.filter((i) => i.key !== key));
  }

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setFetching(true);
      try {
        const params = new URLSearchParams({
          awayTeamId: String(awayTeamMlbId),
          homeTeamId: String(homeTeamMlbId),
        });
        if (overrideGamePk) params.set("gamePk", String(overrideGamePk));
        const res = await fetch(`/api/live-matchup?${params.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setData(json);
          setLastFetchedAt(new Date());

          const now = Date.now();
          const cutoff = now - 90000; // keep a fact visible ~90s, spanning into the next batter
          const fresh: NewsItem[] = [];
          if (json.pitcher) {
            for (const f of json.pitcher.notableFacts || []) {
              fresh.push({ key: `p-${json.pitcher.id}-${f}`, text: `투수 ${json.pitcher.name} — ${f}`, ts: now });
            }
          }
          if (json.batter) {
            for (const f of json.batter.notableFacts || []) {
              fresh.push({ key: `b-${json.batter.id}-${f}`, text: `타자 ${json.batter.name} — ${f}`, ts: now });
            }
          }
          for (const hr of json.recentHomeRuns || []) {
            const tag = hr.ballparks <= 10 ? "아슬아슬한 홈런" : hr.ballparks >= 28 ? "노 다웃 홈런" : "홈런";
            fresh.push({
              key: `hr-${hr.playId}`,
              text: `${tag} ${hr.batterName} — 30개 구장 중 ${hr.ballparks}개에서만 홈런 (${hr.exitVelo}mph, ${hr.distance}ft, ${hr.inning}회 ${hr.halfInning === "top" ? "초" : "말"})`,
              ts: now,
            });
          }
          const dh = json.defensiveHighlight;
          if (dh) {
            const oaaText = dh.oaa != null ? ` (${dh.fielderName} 시즌 OAA ${dh.oaa > 0 ? "+" : ""}${dh.oaa})` : "";
            fresh.push({
              key: `dh-${dh.playId}`,
              text: dh.isOut
                ? `호수비 — xBA ${dh.xba}짜리 타구를 ${dh.position} ${dh.fielderName}가 아웃 처리${oaaText}`
                : `xBA ${dh.xba}짜리 타구가 ${dh.position} ${dh.fielderName} 앞에서 안타로${oaaText}`,
              ts: now,
            });
          }
          setNewsItems((prev) => {
            const map = new Map(prev.map((i) => [i.key, i]));
            for (const f of fresh) if (!map.has(f.key) && !dismissedKeysRef.current.has(f.key)) map.set(f.key, f);
            return [...map.values()].filter((i) => i.ts >= cutoff).sort((a, b) => b.ts - a.ts).slice(0, 5);
          });
        }
      } catch {
        if (!cancelled) setError("불러오는 중 오류가 발생했어요.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [awayTeamMlbId, homeTeamMlbId, overrideGamePk]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <p className="text-sm text-neutral-500 dark:text-neutral-400">불러오는 중...</p>;
  if (data.status === "no_game") {
    return <p className="text-sm text-neutral-500 dark:text-neutral-400">오늘 예정된 경기가 없어요.</p>;
  }

  const md = data as MatchupData;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">실시간 매치업</p>
        <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span className="relative flex h-2 w-2">
            {fetching && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${fetching ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"}`} />
          </span>
          <span>{md.status}</span>
          {lastFetchedAt && (
            <span>· {lastFetchedAt.toLocaleTimeString("ko-KR", { hour12: false })} 갱신</span>
          )}
        </div>
      </div>

      <NewsTicker items={newsItems.filter((i) => !dismissedKeys.has(i.key))} onDismiss={dismissNews} />

      {md.isLive && (
        <p className="mb-3 text-xs text-neutral-500 dark:text-neutral-400">
          {md.inning}회 {md.halfInning === "top" ? "초" : "말"} · {md.outs}아웃 · {md.balls}-{md.strikes}
          {md.linescore && ` · ${md.linescore.away.runs} : ${md.linescore.home.runs}`}
        </p>
      )}
      <div className="flex items-start justify-center gap-6">
        <SideSlot side="away" data={md} />
        <div className="w-8 shrink-0" />
        <SideSlot side="home" data={md} />
      </div>
    </div>
  );
}
