import { createServiceClient } from "@/lib/supabase/server";
import type { Member, Performance, Song, RehearsalSlot } from "@/lib/types";

export async function getCurrentPerformance(): Promise<Performance | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("performances")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as Performance | null;
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
  const { data, error } = await supabase.from("members").select("*").order("name");
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
  submitted_by: string;
  completed_at: string | null;
  submitted_by_member: { name: string } | null;
  song_sessions: SongSessionRow[];
};

export async function getSongsWithSessions(performanceId: string): Promise<Song[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("songs")
    .select(
      `id, performance_id, title, submitted_by, completed_at,
       submitted_by_member:members!songs_submitted_by_fkey(name),
       song_sessions(id, song_id, session_type, sheet_music_url, member_id, claimed_at,
         member:members!song_sessions_member_id_fkey(name))`
    )
    .eq("performance_id", performanceId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  return ((data ?? []) as unknown as SongRow[]).map((row) => ({
    id: row.id,
    performance_id: row.performance_id,
    title: row.title,
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
  }));
}

export async function getSongWithSessions(songId: string): Promise<Song | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("songs")
    .select(
      `id, performance_id, title, submitted_by, completed_at,
       submitted_by_member:members!songs_submitted_by_fkey(name),
       song_sessions(id, song_id, session_type, sheet_music_url, member_id, claimed_at,
         member:members!song_sessions_member_id_fkey(name))`
    )
    .eq("id", songId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as unknown as SongRow;
  return {
    id: row.id,
    performance_id: row.performance_id,
    title: row.title,
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

export async function getRehearsalSlots(performanceId: string): Promise<RehearsalSlot[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rehearsal_slots")
    .select("*")
    .eq("performance_id", performanceId)
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
