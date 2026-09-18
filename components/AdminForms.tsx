"use client";

import { useActionState } from "react";
import {
  createPerformanceAction,
  issueInviteCodeAction,
  setPhaseWindowsAction,
  type AdminActionState,
  type IssueInviteState,
  type SetPhaseWindowsState,
} from "@/app/actions/admin";
import { SCHEDULABLE_PHASES, PHASE_SHORT_LABEL, type Phase } from "@/lib/types";

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
      <input
        name="generation"
        type="number"
        placeholder="기수 (예: 5)"
        className="rounded border px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <input type="checkbox" name="is_admin" />
        관리자 권한도 부여 (회장/부회장이 아니어도 관리 페이지 접근 가능)
      </label>
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

export function PhaseWindowsForm({ initial }: { initial: Partial<Record<Phase, string>> }) {
  const [state, formAction, pending] = useActionState<SetPhaseWindowsState, FormData>(
    setPhaseWindowsAction,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded border bg-white p-4">
      <div>
        <h3 className="text-sm font-semibold">단계 전환 시각</h3>
        <p className="text-xs text-gray-500">
          각 단계가 시작되는 시각(= 바로 앞 단계가 끝나는 시각)만 정하면 돼요. 설정하면 그 시각이
          지난 뒤 누군가 사이트에 들어올 때 자동으로 넘어가고, 비워두면 위의 &ldquo;다음
          단계로&rdquo; 버튼으로 수동 전환해야 해요.
        </p>
      </div>
      {SCHEDULABLE_PHASES.map((phase) => (
        <div key={phase} className="flex flex-wrap items-end gap-2 border-t pt-2 first:border-t-0 first:pt-0">
          <span className="w-32 text-xs text-gray-600">{PHASE_SHORT_LABEL[phase]} 시작</span>
          <input
            type="datetime-local"
            name={`starts_${phase}`}
            defaultValue={initial[phase] ?? ""}
            className="rounded border px-2 py-1 text-sm"
          />
          {phase === "scheduling" && (
            <span className="text-xs text-gray-400">
              이 시각에 2차 신청 마감 + 셋리스트 확정도 같이 돼요
            </span>
          )}
        </div>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "저장 중..." : "일정 저장"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
