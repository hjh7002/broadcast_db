"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Player } from "@/lib/supabase/types";

const fieldClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:border-neutral-400";

export default function PlayerEditForm({ player }: { player: Player }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const bio = player.bio as Record<string, unknown>;
  const [name, setName] = useState(player.name);
  const [position, setPosition] = useState(player.position ?? "");
  const [jerseyNumber, setJerseyNumber] = useState(
    player.jersey_number != null ? String(player.jersey_number) : "",
  );
  const [birthdate, setBirthdate] = useState(String(bio.birthdate ?? ""));
  const [heightWeight, setHeightWeight] = useState(String(bio.height_weight ?? ""));
  const [throwsBats, setThrowsBats] = useState(String(bio.throws_bats ?? ""));
  const [school, setSchool] = useState(String(bio.school ?? ""));
  const [draftInfo, setDraftInfo] = useState(String(bio.draft_info ?? ""));

  async function save() {
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          position: position || null,
          jersey_number: jerseyNumber === "" ? null : Number(jerseyNumber),
          bio: {
            birthdate: birthdate || null,
            height_weight: heightWeight || null,
            throws_bats: throwsBats || null,
            school: school || null,
            draft_info: draftInfo || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "저장에 실패했어요.");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setErrorMsg("네트워크 오류가 발생했어요.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mb-4 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        선수 정보 수정
      </button>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">이름</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">포지션</label>
          <input value={position} onChange={(e) => setPosition(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">등번호</label>
          <input
            value={jerseyNumber}
            onChange={(e) => setJerseyNumber(e.target.value)}
            inputMode="numeric"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">생년월일</label>
          <input
            value={birthdate}
            onChange={(e) => setBirthdate(e.target.value)}
            placeholder="YYYY-MM-DD"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">신장/체중</label>
          <input
            value={heightWeight}
            onChange={(e) => setHeightWeight(e.target.value)}
            placeholder="185cm, 80kg"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">투타유형</label>
          <input
            value={throwsBats}
            onChange={(e) => setThrowsBats(e.target.value)}
            placeholder="우투우타"
            className={fieldClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">출신학교</label>
          <input value={school} onChange={(e) => setSchool(e.target.value)} className={fieldClass} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs text-neutral-500 dark:text-neutral-400">드래프트 정보</label>
          <input value={draftInfo} onChange={(e) => setDraftInfo(e.target.value)} className={fieldClass} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        <button
          onClick={() => setEditing(false)}
          className="rounded-md px-3 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          취소
        </button>
        {errorMsg && <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>}
      </div>
    </div>
  );
}
