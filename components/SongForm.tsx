"use client";

import { useActionState } from "react";
import { submitSongAction, type SubmitSongState } from "@/app/actions/songs";
import { SESSION_TYPES } from "@/lib/types";

const initialState: SubmitSongState = {};

export default function SongForm() {
  const [state, formAction, pending] = useActionState(submitSongAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border bg-white p-4">
      <label className="flex flex-col gap-1 text-sm">
        곡 제목
        <input name="title" required className="rounded border px-3 py-2" />
      </label>

      <p className="text-sm font-medium">필요한 세션 (체크 + 악보 링크)</p>
      {SESSION_TYPES.map((type) => (
        <div key={type} className="flex items-center gap-2">
          <label className="flex w-20 items-center gap-1 text-sm">
            <input type="checkbox" name={`use_${type}`} />
            {type}
          </label>
          <input
            name={`url_${type}`}
            placeholder="악보 링크 (선택)"
            className="flex-1 rounded border px-2 py-1 text-sm"
          />
        </div>
      ))}

      <div className="flex items-center gap-2">
        <input
          name="custom_type"
          placeholder="기타 세션 이름 (선택)"
          className="w-20 rounded border px-2 py-1 text-sm"
        />
        <input
          name="custom_url"
          placeholder="악보 링크 (선택)"
          className="flex-1 rounded border px-2 py-1 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "등록 중..." : "곡 등록"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
