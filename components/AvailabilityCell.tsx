"use client";

import { useTransition } from "react";
import { toggleAvailabilityAction } from "@/app/actions/schedule";

export default function AvailabilityCell({
  slotId,
  count,
  isMine,
}: {
  slotId: string;
  count: number;
  isMine: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleAvailabilityAction(slotId);
        })
      }
      className={`rounded border px-3 py-2 text-sm ${
        isMine ? "bg-black text-white" : "bg-white"
      } disabled:opacity-50`}
    >
      {count}명
    </button>
  );
}
