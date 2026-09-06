"use client";

import { useState } from "react";
import PlayerPopupModal from "@/components/PlayerPopupModal";

export default function PlayerNamePopupTrigger({
  playerId,
  playerName,
  sportCode,
  personId,
  opponentPitcherId,
  opponentTeamId,
  hitStreak,
  onBaseStreak,
  initialMemo,
}: {
  playerId: string;
  playerName: string;
  sportCode: string;
  personId: number | null;
  opponentPitcherId: number | null;
  opponentTeamId: number | null;
  hitStreak?: Record<string, unknown> | null;
  onBaseStreak?: Record<string, unknown> | null;
  initialMemo: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="hover:underline"
      >
        {playerName}
      </span>
      {open && (
        <PlayerPopupModal
          playerId={playerId}
          playerName={playerName}
          sportCode={sportCode}
          personId={personId}
          opponentPitcherId={opponentPitcherId}
          opponentTeamId={opponentTeamId}
          hitStreak={hitStreak as never}
          onBaseStreak={onBaseStreak as never}
          initialMemo={initialMemo}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
