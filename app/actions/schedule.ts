"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

async function isSongMember(songId: string, memberId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("song_sessions")
    .select("id")
    .eq("song_id", songId)
    .eq("member_id", memberId)
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}

/** "YYYY-MM-DD" 날짜 하나에 대해 0시~24시까지 1시간 단위 후보 슬롯 24개를 만든다. */
function hourlyStartsForDate(dateStr: string): string[] {
  const pad = (n: number) => String(n).padStart(2, "0");
  return Array.from({ length: 24 }, (_, hour) => `${dateStr}T${pad(hour)}:00:00`);
}

export type CreateSlotState = { error?: string };

export async function addRehearsalDateAction(
  _prev: CreateSlotState,
  formData: FormData
): Promise<CreateSlotState> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  const songId = String(formData.get("song_id") ?? "");
  const date = String(formData.get("date") ?? "").trim();
  if (!date) return { error: "날짜를 선택해주세요" };

  if (!session.isAdmin && !(await isSongMember(songId, session.memberId))) {
    return { error: "이 곡에 참여한 멤버만 날짜를 추가할 수 있어요" };
  }

  const supabase = createServiceClient();
  const rows = hourlyStartsForDate(date).map((starts_at) => ({ song_id: songId, starts_at }));
  const { error } = await supabase
    .from("rehearsal_slots")
    .upsert(rows, { onConflict: "song_id,starts_at", ignoreDuplicates: true });
  if (error) return { error: error.message };

  revalidatePath(`/songs/${songId}`);
  return {};
}

/** 드래그로 여러 칸을 한 번에 선택했을 때, 그 슬롯들에 대해 내 가능 여부를 한 번에 설정한다. */
export async function setAvailabilityAction(
  songId: string,
  slotIds: string[],
  available: boolean
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };
  if (slotIds.length === 0) return {};

  if (!session.isAdmin && !(await isSongMember(songId, session.memberId))) {
    return { error: "이 곡에 참여한 멤버만 응답할 수 있어요" };
  }

  const supabase = createServiceClient();
  if (available) {
    const rows = slotIds.map((slot_id) => ({ slot_id, member_id: session.memberId }));
    const { error } = await supabase
      .from("availabilities")
      .upsert(rows, { onConflict: "slot_id,member_id", ignoreDuplicates: true });
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("availabilities")
      .delete()
      .in("slot_id", slotIds)
      .eq("member_id", session.memberId);
    if (error) return { error: error.message };
  }

  revalidatePath(`/songs/${songId}`);
  return {};
}
