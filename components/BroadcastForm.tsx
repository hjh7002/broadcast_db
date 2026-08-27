"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Sport, Team } from "@/lib/supabase/types";

const selectClass =
  "min-w-[10rem] rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";

export default function BroadcastForm({ sports, teams }: { sports: Sport[]; teams: Team[] }) {
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [homeNote, setHomeNote] = useState("");
  const [awayNote, setAwayNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const teamsForSport = useMemo(() => teams.filter((t) => t.sport_id === sportId), [teams, sportId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sportId || !homeTeamId || !awayTeamId) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sport_id: sportId,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          home_note: homeNote.trim() || undefined,
          away_note: awayNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "저장에 실패했어요.");
        return;
      }
      router.refresh();
    } catch {
      setErrorMsg("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">종목</label>
          <select
            value={sportId}
            onChange={(e) => {
              setSportId(e.target.value);
              setHomeTeamId("");
              setAwayTeamId("");
            }}
            className={selectClass}
          >
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">원정팀 (좌측)</label>
          <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className={selectClass}>
            <option value="">선택</option>
            {teamsForSport.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">홈팀 (우측)</label>
          <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className={selectClass}>
            <option value="">선택</option>
            {teamsForSport.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">원정팀 메모 (선택)</label>
          <textarea
            value={awayNote}
            onChange={(e) => setAwayNote(e.target.value)}
            rows={4}
            placeholder="원정팀 관련 메모 (선발 라인업, 주목할 점 등) — 나중에 중계 화면에서도 계속 수정할 수 있어요"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">홈팀 메모 (선택)</label>
          <textarea
            value={homeNote}
            onChange={(e) => setHomeNote(e.target.value)}
            rows={4}
            placeholder="홈팀 관련 메모 (선발 라인업, 주목할 점 등) — 나중에 중계 화면에서도 계속 수정할 수 있어요"
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={saving || !homeTeamId || !awayTeamId}
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {saving ? "저장 중..." : "오늘의 중계로 설정"}
        </button>
      </div>
      {errorMsg && <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>}
    </form>
  );
}
