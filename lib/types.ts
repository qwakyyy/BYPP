import type { Role } from "@/lib/auth";

export type { Role };

export type Phase =
  | "draft"
  | "song_submission"
  | "session_signup_phase1"
  | "session_signup_phase2"
  | "setlist_locked"
  | "scheduling"
  | "done";

export const PHASE_ORDER: Phase[] = [
  "draft",
  "song_submission",
  "session_signup_phase1",
  "session_signup_phase2",
  "setlist_locked",
  "scheduling",
  "done",
];

export const PHASE_LABEL: Record<Phase, string> = {
  draft: "준비 중",
  song_submission: "곡 등록 중",
  session_signup_phase1: "세션 신청 1차 (최대 2곡)",
  session_signup_phase2: "세션 신청 2차 (제한 없음)",
  setlist_locked: "셋리스트 확정",
  scheduling: "합주 일정 조율",
  done: "종료",
};

export const SESSION_TYPES = ["보컬", "기타1", "기타2", "베이스", "드럼", "건반"] as const;

export type Member = {
  id: string;
  name: string;
  instrument: string;
  role: Role;
};

export type Performance = {
  id: string;
  title: string;
  event_date: string | null;
  phase: Phase;
  max_setlist_size: number | null;
  max_songs_per_member_phase1: number;
};

export type SongSession = {
  id: string;
  song_id: string;
  session_type: string;
  sheet_music_url: string | null;
  member_id: string | null;
  member_name: string | null;
  claimed_at: string | null;
};

export type Song = {
  id: string;
  performance_id: string;
  title: string;
  submitted_by: string;
  submitted_by_name: string | null;
  completed_at: string | null;
  sessions: SongSession[];
};

export type RehearsalSlot = {
  id: string;
  performance_id: string;
  starts_at: string;
  ends_at: string;
};
