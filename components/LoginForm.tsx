"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        이름
        <input
          name="name"
          required
          className="rounded border px-3 py-2"
          placeholder="예: 김철수"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        악기 (처음 로그인 시에만 필요)
        <input name="instrument" className="rounded border px-3 py-2" placeholder="예: 기타" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        초대코드 (처음 로그인 시에만 필요)
        <input name="code" className="rounded border px-3 py-2" placeholder="동아리에서 받은 코드" />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "로그인"}
      </button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
