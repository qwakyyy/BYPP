"use client";

import { useActionState } from "react";
import { addRehearsalDateAction, type CreateSlotState } from "@/app/actions/schedule";

const initialState: CreateSlotState = {};

export default function AddRehearsalDateForm({ songId }: { songId: string }) {
  const [state, formAction, pending] = useActionState(addRehearsalDateAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="song_id" value={songId} />
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        합주 후보 날짜 추가
        <input type="date" name="date" required className="rounded border px-2 py-1 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "추가 중..." : "날짜 추가"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
