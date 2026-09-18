"use client";

import { useActionState } from "react";
import { claimSessionAction, unclaimSessionAction, type ClaimState } from "@/app/actions/sessions";

const initialState: ClaimState = {};

export function ClaimButton({ songSessionId }: { songSessionId: string }) {
  const [state, formAction, pending] = useActionState(claimSessionAction, initialState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="song_session_id" value={songSessionId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
      >
        {pending ? "신청 중..." : "신청하기"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}

export function UnclaimButton({ songSessionId }: { songSessionId: string }) {
  const [state, formAction, pending] = useActionState(unclaimSessionAction, initialState);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="song_session_id" value={songSessionId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded border px-3 py-1 text-sm text-gray-600 disabled:opacity-50"
      >
        {pending ? "취소 중..." : "신청 취소"}
      </button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
