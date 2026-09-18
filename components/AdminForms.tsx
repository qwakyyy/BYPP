"use client";

import { useActionState } from "react";
import {
  createPerformanceAction,
  issueInviteCodeAction,
  createRehearsalSlotAction,
  type AdminActionState,
  type IssueInviteState,
  type CreateSlotState,
} from "@/app/actions/admin";

export function PerformanceForm() {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(
    createPerformanceAction,
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border bg-white p-4">
      <h3 className="text-sm font-semibold">공연 만들기</h3>
      <input name="title" placeholder="공연 이름" required className="rounded border px-3 py-2 text-sm" />
      <input name="event_date" type="date" className="rounded border px-3 py-2 text-sm" />
      <input
        name="max_setlist_size"
        type="number"
        placeholder="셋리스트 정원 (비우면 무제한)"
        className="rounded border px-3 py-2 text-sm"
      />
      <input
        name="max_songs_per_member_phase1"
        type="number"
        placeholder="1차 신청 1인당 곡 수 (기본 2)"
        className="rounded border px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "생성 중..." : "생성"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function InviteCodeForm() {
  const [state, formAction, pending] = useActionState<IssueInviteState, FormData>(
    issueInviteCodeAction,
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border bg-white p-4">
      <h3 className="text-sm font-semibold">초대코드 발급</h3>
      <input
        name="code"
        placeholder="코드 (예: byp-member-2026)"
        required
        className="rounded border px-3 py-2 text-sm"
      />
      <select name="role" className="rounded border px-3 py-2 text-sm">
        <option value="member">member</option>
        <option value="vice_president">vice_president</option>
        <option value="president">president</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "발급 중..." : "발급"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}

export function SlotForm() {
  const [state, formAction, pending] = useActionState<CreateSlotState, FormData>(
    createRehearsalSlotAction,
    {}
  );
  return (
    <form action={formAction} className="flex flex-col gap-2 rounded border bg-white p-4">
      <h3 className="text-sm font-semibold">합주 후보 시간 추가</h3>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        시작
        <input name="starts_at" type="datetime-local" required className="rounded border px-3 py-2 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs text-gray-600">
        종료
        <input name="ends_at" type="datetime-local" required className="rounded border px-3 py-2 text-sm" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "추가 중..." : "추가"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
