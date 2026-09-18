"use server";

import { revalidatePath } from "next/cache";
import { getSession, type Role } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentPerformance } from "@/lib/queries";
import { kstLocalToIso } from "@/lib/datetime";
import { PHASE_ORDER, SCHEDULABLE_PHASES, type Phase } from "@/lib/types";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    throw new Error("관리자만 사용할 수 있어요");
  }
  return session;
}

export type AdminActionState = { error?: string };

export async function createPerformanceAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdmin();

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
  await requireAdmin();

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
  return {};
}

export type IssueInviteState = { error?: string };

export async function issueInviteCodeAction(
  _prev: IssueInviteState,
  formData: FormData
): Promise<IssueInviteState> {
  await requireAdmin();

  const code = String(formData.get("code") ?? "").trim();
  const role = String(formData.get("role") ?? "member") as Role;
  const generationRaw = String(formData.get("generation") ?? "").trim();
  const isAdmin = formData.get("is_admin") === "on";
  if (!code) return { error: "코드를 입력해주세요" };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("invite_codes")
    .insert({ code, role, generation: generationRaw ? Number(generationRaw) : 1, is_admin: isAdmin });
  if (error) return { error: "발급 실패: " + error.message };

  revalidatePath("/admin");
  return {};
}

export type SetPhaseWindowsState = { error?: string };

export async function setPhaseWindowsAction(
  _prev: SetPhaseWindowsState,
  formData: FormData
): Promise<SetPhaseWindowsState> {
  await requireAdmin();

  const performance = await getCurrentPerformance();
  if (!performance) return { error: "먼저 공연을 만들어주세요" };

  const rows = SCHEDULABLE_PHASES.map((phase) => {
    const startsRaw = String(formData.get(`starts_${phase}`) ?? "").trim();
    return {
      performance_id: performance.id,
      phase,
      starts_at: startsRaw ? kstLocalToIso(startsRaw) : null,
    };
  });

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("phase_windows")
    .upsert(rows, { onConflict: "performance_id,phase" });
  if (error) return { error: error.message };

  revalidatePath("/admin");
  revalidatePath("/");
  return {};
}
