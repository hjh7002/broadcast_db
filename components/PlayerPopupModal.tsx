"use client";

import { useEffect, useState } from "react";
import PlayerMemoEditor from "@/components/PlayerMemoEditor";

type Streak = { games: number; ab: number; hits: number; hr: number; avg: string; ops?: string } & Record<string, unknown>;
type VsPitcherLine = { games: number; ab: number; hits: number; avg: string; ops: string; hr: number };
type GameLine = { date: string; ab: number; hits: number; hr: number; doubles: number; triples: number; rbi: number; sb: number; so: number; bb: number };
type SeriesInfo = { games: number; isPrevious: boolean; opponentName: string | null; perGame: GameLine[] };

function extrasFor(g: GameLine): string {
  const parts: string[] = [];
  if (g.hr > 0) parts.push(`${g.hr}홈런`);
  if (g.triples > 0) parts.push(`${g.triples}3루타`);
  if (g.doubles > 0) parts.push(`${g.doubles}2루타`);
  if (g.rbi > 0) parts.push(`${g.rbi}타점`);
  if (g.sb > 0) parts.push(`${g.sb}도루`);
  if (g.bb > 0) parts.push(`${g.bb}볼넷`);
  if (g.so > 0) parts.push(`${g.so}삼진`);
  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

export default function PlayerPopupModal({
  playerId,
  playerName,
  sportCode,
  personId,
  opponentPitcherId,
  opponentTeamId,
  hitStreak,
  onBaseStreak,
  initialMemo,
  onClose,
}: {
  playerId: string;
  playerName: string;
  sportCode: string;
  personId: number | null;
  opponentPitcherId: number | null;
  opponentTeamId: number | null;
  hitStreak?: Streak | null;
  onBaseStreak?: Streak | null;
  initialMemo: string;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [vsPitcher, setVsPitcher] = useState<VsPitcherLine | null>(null);
  const [pitcherName, setPitcherName] = useState<string | null>(null);
  const [series, setSeries] = useState<SeriesInfo | null>(null);

  useEffect(() => {
    if (!personId) return;
    setLoading(true);
    const params = new URLSearchParams({ personId: String(personId) });
    if (opponentPitcherId) params.set("opponentPitcherId", String(opponentPitcherId));
    if (opponentTeamId) params.set("opponentTeamId", String(opponentTeamId));
    fetch(`/api/player-popup?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setVsPitcher(d.vsPitcher);
        setPitcherName(d.pitcherName);
        setSeries(d.series);
      })
      .finally(() => setLoading(false));
  }, [personId, opponentPitcherId, opponentTeamId]);

  const showOnBase = onBaseStreak && (!hitStreak || onBaseStreak.games > hitStreak.games);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-lg bg-white p-5 shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{playerName}</p>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
        <a
          href={`/${sportCode}/players/${playerId}`}
          className="mb-4 inline-block text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          선수 페이지 전체보기 →
        </a>

        {(hitStreak || showOnBase) && (
          <div className="mb-3 space-y-1 text-sm">
            {hitStreak && (
              <p>
                <span className="text-neutral-500 dark:text-neutral-400">연속안타</span>{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {hitStreak.games}경기({hitStreak.hits}-{hitStreak.ab}, {hitStreak.avg}
                  {hitStreak.hr ? ` ${hitStreak.hr}홈런` : ""})
                </span>
              </p>
            )}
            {showOnBase && (
              <p>
                <span className="text-neutral-500 dark:text-neutral-400">연속출루</span>{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {onBaseStreak.games}경기({onBaseStreak.hits}-{onBaseStreak.ab}, {onBaseStreak.avg})
                </span>
              </p>
            )}
          </div>
        )}

        {opponentPitcherId && (
          <div className="mb-3 text-sm">
            <span className="text-neutral-500 dark:text-neutral-400">{pitcherName ?? "상대 투수"} 상대 전적</span>{" "}
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {loading ? "..." : vsPitcher ? `${vsPitcher.hits}-${vsPitcher.ab}, ${vsPitcher.avg} OPS ${vsPitcher.ops} ${vsPitcher.hr}홈런` : "0-0 (첫 상대)"}
            </span>
          </div>
        )}

        {series && series.perGame.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
              {series.isPrevious ? `직전 시리즈${series.opponentName ? `(vs ${series.opponentName})` : ""}` : "이번 시리즈"}
            </p>
            <div className="space-y-0.5 text-sm text-neutral-900 dark:text-neutral-100">
              {series.perGame.map((g, i) => (
                <p key={g.date}>
                  {i + 1}차전 {g.hits}-{g.ab}
                  {extrasFor(g)}
                </p>
              ))}
            </div>
          </div>
        )}

        <PlayerMemoEditor playerId={playerId} initialMemo={initialMemo} />
      </div>
    </div>
  );
}
