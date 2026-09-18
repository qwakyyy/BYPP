import { createServiceClient } from "@/lib/supabase/server";
import { resolveAutoPhase, type PhaseWindowMap } from "@/lib/phase-auto";
import type { Member, Performance, Phase, Song, RehearsalSlot } from "@/lib/types";

export async function getCurrentPerformance(): Promise<Performance | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("performances")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const performance = data as Performance;
  const windows = await getPhaseWindows(performance.id);
  const autoPhase = resolveAutoPhase(performance.phase, windows, new Date());

  // 일정에 설정된 시각이 지나 있으면 다음 방문자가 볼 때 자동으로 phase를 따라잡는다.
  // (전용 크론 없이 "다음 페이지 로드 때 반영"으로 단순화한 것 — 정확히 그 순간에 바뀌어야
  // 한다면 Vercel Cron으로 승격하면 됨)
  if (autoPhase !== performance.phase) {
    const { error: updateError } = await supabase
      .from("performances")
      .update({ phase: autoPhase })
      .eq("id", performance.id);
    if (!updateError) performance.phase = autoPhase;
  }

  return performance;
}

export async function getPhaseWindows(performanceId: string): Promise<PhaseWindowMap> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("phase_windows")
    .select("phase, starts_at")
    .eq("performance_id", performanceId);
  if (error) throw error;

  const map: PhaseWindowMap = {};
  for (const row of data ?? []) {
    map[row.phase as Phase] = { startsAt: row.starts_at };
  }
  return map;
}

export async function getMember(memberId: string): Promise<Member | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();
  if (error) throw error;
  return data as Member | null;
}

export async function getMemberByName(name: string): Promise<Member | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .ilike("name", name)
    .maybeSingle();
  if (error) throw error;
  return data as Member | null;
}

export async function getAllMembers(): Promise<Member[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("generation", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Member[];
}

type SongSessionRow = {
  id: string;
  song_id: string;
  session_type: string;
  sheet_music_url: string | null;
  member_id: string | null;
  claimed_at: string | null;
  member: { name: string } | null;
};

type SongRow = {
  id: string;
  performance_id: string;
  title: string;
  artist: string | null;
  submitted_by: string;
  completed_at: string | null;
  submitted_by_member: { name: string } | null;
  song_sessions: SongSessionRow[];
};

const SONG_SELECT = `id, performance_id, title, artist, submitted_by, completed_at,
       submitted_by_member:members!songs_submitted_by_fkey(name),
       song_sessions(id, song_id, session_type, sheet_music_url, member_id, claimed_at,
         member:members!song_sessions_member_id_fkey(name))`;

function mapSongRow(row: SongRow): Song {
  return {
    id: row.id,
    performance_id: row.performance_id,
    title: row.title,
    artist: row.artist,
    submitted_by: row.submitted_by,
    submitted_by_name: row.submitted_by_member?.name ?? null,
    completed_at: row.completed_at,
    sessions: (row.song_sessions ?? []).map((s) => ({
      id: s.id,
      song_id: s.song_id,
      session_type: s.session_type,
      sheet_music_url: s.sheet_music_url,
      member_id: s.member_id,
      member_name: s.member?.name ?? null,
      claimed_at: s.claimed_at,
    })),
  };
}

export async function getSongsWithSessions(performanceId: string): Promise<Song[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .eq("performance_id", performanceId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as SongRow[]).map(mapSongRow);
}

export async function getSongWithSessions(songId: string): Promise<Song | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("songs")
    .select(SONG_SELECT)
    .eq("id", songId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return mapSongRow(data as unknown as SongRow);
}

export async function getRehearsalSlotsForSong(songId: string): Promise<RehearsalSlot[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rehearsal_slots")
    .select("id, song_id, starts_at")
    .eq("song_id", songId)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as RehearsalSlot[];
}

/** slot_id -> 그 시간에 가능하다고 표시한 member_id 목록 */
export async function getAvailabilityMap(slotIds: string[]): Promise<Record<string, string[]>> {
  if (slotIds.length === 0) return {};
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("availabilities")
    .select("slot_id, member_id")
    .in("slot_id", slotIds);
  if (error) throw error;

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    (map[row.slot_id] ??= []).push(row.member_id);
  }
  return map;
}
