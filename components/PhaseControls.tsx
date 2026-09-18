"use client";

import { useState, useTransition } from "react";
import { advancePhaseAction } from "@/app/actions/admin";
import { PHASE_ORDER, PHASE_SHORT_LABEL, type Phase } from "@/lib/types";

export default function PhaseControls({ currentPhase }: { currentPhase: Phase }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  const nextPhase = PHASE_ORDER[currentIndex + 1];

  if (!nextPhase) return <p className="text-sm text-gray-500">마지막 단계예요.</p>;

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await advancePhaseAction(nextPhase);
            setError(result.error ?? null);
          })
        }
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "전환 중..." : `다음 단계로: ${PHASE_SHORT_LABEL[nextPhase]}`}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
