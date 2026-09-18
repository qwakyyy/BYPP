"use server";

import { revalidatePath } from "next/cache";
import { getSession, isOfficer, type Role } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentPerformance } from "@/lib/queries";
import { PHASE_ORDER, type Phase } from "@/lib/types";

async function requireOfficer() {
  const session = await getSession();
  if (!session || !isOfficer(session.role)) {
    throw new Error("회장/부회장만 사용할 수 있어요");
  }
  return session;
}

export type AdminActionState = { error?: string };

export async function createPerformanceAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireOfficer();

  const title = String(formData.get("title") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const maxSetlistSizeRaw = String(formData.get("max_setlist_size") ?? "").trim();
  const maxSongsPhase1Raw = String(formData.get("max_songs_per_member_phase1") ?? "").trim();

  if (!title) return { error: "공연 이름을 입력해주세요" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("performances").insert({
    title,
    event_date: eventDate || null,
    max_setlist_size: maxSetlistSizeRaw ? Number(maxSetlistSizeRaw) : null,
    max_songs_per_member_phase1: maxSongsPhase1Raw ? Number(maxSongsPhase1Raw) : 2,
  });
  if (error) return { error: "생성 실패: " + error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}

export async function advancePhaseAction(nextPhase: Phase): Promise<AdminActionState> {
  await requireOfficer();

  const performance = await getCurrentPerformance();
  if (!performance) return { error: "먼저 공연을 만들어주세요" };

  const currentIndex = PHASE_ORDER.indexOf(performance.phase);
  const nextIndex = PHASE_ORDER.indexOf(nextPhase);
  if (nextIndex !== currentIndex + 1) {
    return { error: "phase는 순서대로만 전환할 수 있어요" };
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("performances")
    .update({ phase: nextPhase })
    .eq("id", performance.id);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/songs");
  revalidatePath("/setlist");
  revalidatePath("/schedule");
  return {};
}

export type IssueInviteState = { error?: string };

export async function issueInviteCodeAction(
  _prev: IssueInviteState,
  formData: FormData
): Promise<IssueInviteState> {
  await requireOfficer();

  const code = String(formData.get("code") ?? "").trim();
  const role = String(formData.get("role") ?? "member") as Role;
  if (!code) return { error: "코드를 입력해주세요" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("invite_codes").insert({ code, role });
  if (error) return { error: "발급 실패: " + error.message };

  revalidatePath("/admin");
  return {};
}

export type CreateSlotState = { error?: string };

export async function createRehearsalSlotAction(
  _prev: CreateSlotState,
  formData: FormData
): Promise<CreateSlotState> {
  await requireOfficer();

  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!startsAt || !endsAt) return { error: "시작/종료 시간을 입력해주세요" };

  const performance = await getCurrentPerformance();
  if (!performance) return { error: "먼저 공연을 만들어주세요" };

  const supabase = createServiceClient();
  const { error } = await supabase.from("rehearsal_slots").insert({
    performance_id: performance.id,
    starts_at: startsAt,
    ends_at: endsAt,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/schedule");
  return {};
}
