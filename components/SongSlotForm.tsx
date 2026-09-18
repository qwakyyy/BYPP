"use client";

import { useActionState } from "react";
import { createSongSlotAction, type CreateSlotState } from "@/app/actions/schedule";

const initialState: CreateSlotState = {};

export default function SongSlotForm({ songId }: { songId: string }) {
  const [state, formAction, pending] = useActionState(createSongSlotAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border bg-white p-3">
      <input type="hidden" name="song_id" value={songId} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          시작
          <input name="starts_at" type="datetime-local" required className="rounded border px-2 py-1 text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-600">
          종료
          <input name="ends_at" type="datetime-local" required className="rounded border px-2 py-1 text-sm" />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {pending ? "추가 중..." : "후보 시간 추가"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
