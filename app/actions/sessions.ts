"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { getCurrentPerformance } from "@/lib/queries";
import { canClaimSongInPhase1 } from "@/lib/setlist";

export type ClaimState = { error?: string };

export async function claimSessionAction(
  _prev: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const songSessionId = String(formData.get("song_session_id") ?? "");
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  const performance = await getCurrentPerformance();
  if (!performance) return { error: "진행 중인 공연이 없어요" };
  if (
    performance.phase !== "session_signup_phase1" &&
    performance.phase !== "session_signup_phase2"
  ) {
    return { error: "지금은 세션 신청 기간이 아니에요" };
  }

  const supabase = createServiceClient();

  const { data: target, error: targetError } = await supabase
    .from("song_sessions")
    .select("id, song_id")
    .eq("id", songSessionId)
    .maybeSingle();
  if (targetError) throw targetError;
  if (!target) return { error: "존재하지 않는 세션이에요" };

  if (performance.phase === "session_signup_phase1") {
    const { data: performanceSongs, error: psError } = await supabase
      .from("songs")
      .select("id")
      .eq("performance_id", performance.id);
    if (psError) throw psError;
    const performanceSongIds = (performanceSongs ?? []).map((s) => s.id);

    let distinctSongIds: string[] = [];
    if (performanceSongIds.length > 0) {
      const { data: myClaims, error: myClaimsError } = await supabase
        .from("song_sessions")
        .select("song_id")
        .eq("member_id", session.memberId)
        .in("song_id", performanceSongIds);
      if (myClaimsError) throw myClaimsError;
      distinctSongIds = [...new Set((myClaims ?? []).map((r) => r.song_id))];
    }

    if (
      !canClaimSongInPhase1(
        distinctSongIds,
        target.song_id,
        performance.max_songs_per_member_phase1
      )
    ) {
      return {
        error: `1차 신청은 최대 ${performance.max_songs_per_member_phase1}곡까지만 가능해요`,
      };
    }
  }

  // 원자적 선착순: member_id가 비어있을 때만 갱신되므로 동시에 눌러도 한쪽만 성공한다
  const { data: claimed, error: claimError } = await supabase
    .from("song_sessions")
    .update({ member_id: session.memberId, claimed_at: new Date().toISOString() })
    .eq("id", songSessionId)
    .is("member_id", null)
    .select("id");
  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) {
    return { error: "이미 다른 멤버가 신청했어요" };
  }

  const { data: remaining, error: remainingError } = await supabase
    .from("song_sessions")
    .select("id")
    .eq("song_id", target.song_id)
    .is("member_id", null);
  if (remainingError) throw remainingError;

  if ((remaining ?? []).length === 0) {
    await supabase
      .from("songs")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", target.song_id)
      .is("completed_at", null);
  }

  revalidatePath(`/songs/${target.song_id}`);
  revalidatePath("/setlist");
  return {};
}

export async function unclaimSessionAction(
  _prev: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const songSessionId = String(formData.get("song_session_id") ?? "");
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("song_sessions")
    .update({ member_id: null, claimed_at: null })
    .eq("id", songSessionId)
    .eq("member_id", session.memberId)
    .select("song_id");
  if (error) throw error;
  if (!data || data.length === 0) return { error: "취소할 수 없어요" };

  await supabase.from("songs").update({ completed_at: null }).eq("id", data[0].song_id);

  revalidatePath(`/songs/${data[0].song_id}`);
  revalidatePath("/setlist");
  return {};
}
