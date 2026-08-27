import type { SportStatField } from "@/lib/supabase/types";
import PlayerStatSummary from "./PlayerStatSummary";

type TeamSplit = { team: string } & Record<string, unknown>;

export default function PlayerTeamSplits({
  statFields,
  splits,
}: {
  statFields: SportStatField[];
  splits: TeamSplit[] | undefined;
}) {
  if (!splits || splits.length < 2) return null;

  return (
    <div className="mt-6 space-y-4">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">시즌 중 이적 — 팀별 성적</p>
      {splits.map((s) => (
        <div key={s.team}>
          <p className="mb-2 text-sm font-medium">{s.team}</p>
          <PlayerStatSummary statFields={statFields} stats={s} />
        </div>
      ))}
    </div>
  );
}
