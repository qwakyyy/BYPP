"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { createSessionCookie, clearSessionCookie, type Role } from "@/lib/auth";
import { getMemberByName } from "@/lib/queries";

export type LoginState = { error?: string };

// ponytail: 비밀번호 없이 이름으로 재로그인 — 이름이 겹치면 남의 계정으로 들어갈 수 있음.
// 소규모 동아리 내부용이라 감수한 선택. 문제되면 이름 유니크 강제 + 안내로 보완.
export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const instrument = String(formData.get("instrument") ?? "").trim();

  if (!name) return { error: "이름을 입력해주세요" };

  const existing = await getMemberByName(name);
  if (existing) {
    await createSessionCookie(existing.id, existing.role);
    redirect("/");
  }

  if (!code) return { error: "처음 로그인하려면 초대코드가 필요해요" };

  const supabase = createServiceClient();
  const { data: invite, error: inviteError } = await supabase
    .from("invite_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (inviteError) throw inviteError;
  if (!invite) return { error: "초대코드를 찾을 수 없어요" };

  const { data: created, error: insertError } = await supabase
    .from("members")
    .insert({ name, instrument, role: invite.role as Role, generation: invite.generation })
    .select("*")
    .single();
  if (insertError) return { error: "가입 실패: " + insertError.message };

  await createSessionCookie(created.id, created.role as Role);
  redirect("/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
