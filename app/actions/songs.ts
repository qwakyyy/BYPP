"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentPerformance } from "@/lib/queries";
import { SESSION_TYPES } from "@/lib/types";

export type SubmitSongState = { error?: string };

export async function submitSongAction(
  _prev: SubmitSongState,
  formData: FormData
): Promise<SubmitSongState> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  const performance = await getCurrentPerformance();
  if (!performance || performance.phase !== "song_submission") {
    return { error: "지금은 곡 등록 기간이 아니에요" };
  }

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "곡 제목을 입력해주세요" };

  const rows: { session_type: string; sheet_music_url: string | null }[] = [];
  for (const type of SESSION_TYPES) {
    if (formData.get(`use_${type}`) === "on") {
      const url = String(formData.get(`url_${type}`) ?? "").trim();
      rows.push({ session_type: type, sheet_music_url: url || null });
    }
  }
  const customType = String(formData.get("custom_type") ?? "").trim();
  if (customType) {
    const customUrl = String(formData.get("custom_url") ?? "").trim();
    rows.push({ session_type: customType, sheet_music_url: customUrl || null });
  }

  if (rows.length === 0) return { error: "세션을 최소 1개 이상 선택해주세요" };

  const supabase = createServiceClient();
  const { data: song, error: songError } = await supabase
    .from("songs")
    .insert({ performance_id: performance.id, title, submitted_by: session.memberId })
    .select("id")
    .single();
  if (songError) return { error: "등록 실패: " + songError.message };

  const { error: sessionsError } = await supabase
    .from("song_sessions")
    .insert(rows.map((r) => ({ ...r, song_id: song.id })));
  if (sessionsError) return { error: "세션 등록 실패: " + sessionsError.message };

  revalidatePath("/songs");
  return {};
}
