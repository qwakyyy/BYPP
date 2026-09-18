"use server";

import { revalidatePath } from "next/cache";
import { getSession, isOfficer } from "@/lib/auth";
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

export type CreateSlotState = { error?: string };

export async function createSongSlotAction(
  _prev: CreateSlotState,
  formData: FormData
): Promise<CreateSlotState> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  const songId = String(formData.get("song_id") ?? "");
  const startsAt = String(formData.get("starts_at") ?? "").trim();
  const endsAt = String(formData.get("ends_at") ?? "").trim();
  if (!startsAt || !endsAt) return { error: "시작/종료 시간을 입력해주세요" };

  if (!isOfficer(session.role) && !(await isSongMember(songId, session.memberId))) {
    return { error: "이 곡에 참여한 멤버만 시간을 추가할 수 있어요" };
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("rehearsal_slots").insert({
    song_id: songId,
    starts_at: startsAt,
    ends_at: endsAt,
  });
  if (error) return { error: error.message };

  revalidatePath(`/songs/${songId}`);
  return {};
}

export async function toggleAvailabilityAction(
  slotId: string,
  songId: string
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  if (!isOfficer(session.role) && !(await isSongMember(songId, session.memberId))) {
    return { error: "이 곡에 참여한 멤버만 응답할 수 있어요" };
  }

  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("availabilities")
    .select("id")
    .eq("slot_id", slotId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase.from("availabilities").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("availabilities")
      .insert({ slot_id: slotId, member_id: session.memberId });
    if (error) throw error;
  }

  revalidatePath(`/songs/${songId}`);
  return {};
}
