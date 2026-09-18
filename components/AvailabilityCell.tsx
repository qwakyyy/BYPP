"use client";

import { useState, useTransition } from "react";
import { toggleAvailabilityAction } from "@/app/actions/schedule";

export default function AvailabilityCell({
  slotId,
  songId,
  count,
  isMine,
}: {
  slotId: string;
  songId: string;
  count: number;
  isMine: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await toggleAvailabilityAction(slotId, songId);
            setError(result.error ?? null);
          })
        }
        className={`rounded border px-3 py-2 text-sm ${
          isMine ? "bg-black text-white" : "bg-white"
        } disabled:opacity-50`}
      >
        {count}명
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
