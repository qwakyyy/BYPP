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

/** "다음 단계로: ○○" 버튼처럼 짧게 표시할 때 쓰는 라벨 (진행 중이라는 뉘앙스 없이) */
export const PHASE_SHORT_LABEL: Record<Phase, string> = {
  draft: "준비",
  song_submission: "곡 등록",
  session_signup_phase1: "세션 신청 1차",
  session_signup_phase2: "세션 신청 2차",
  setlist_locked: "셋리스트 확정",
  scheduling: "합주 일정 조율",
  done: "종료",
};

/** 일정을 admin이 미리 설정해서 자동 전환을 걸 수 있는 phase들 (draft/setlist_locked/done 제외).
 * 각 phase의 시작 시각 = 바로 앞 phase의 종료 시각이라, 시작 시각 하나만 정하면 된다. */
export const SCHEDULABLE_PHASES: Phase[] = [
  "song_submission",
  "session_signup_phase1",
  "session_signup_phase2",
  "scheduling",
];

export const ROLE_LABEL: Record<Role, string> = {
  president: "회장",
  vice_president: "부회장",
  member: "멤버",
};

export const SESSION_TYPES = ["보컬", "기타1", "기타2", "베이스", "드럼", "건반"] as const;

/** 보컬은 악보 링크가 필요 없다 */
export const VOCAL_SESSION_TYPE = "보컬";

export const SESSION_CATEGORIES = ["전체", "보컬", "기타", "베이스", "건반", "드럼", "그 외"] as const;
export type SessionCategory = (typeof SESSION_CATEGORIES)[number];

/** 세션 이름을 필터 카테고리로 묶는다 (기타1/기타2는 "기타"로 합침) */
export function categorize(sessionType: string): Exclude<SessionCategory, "전체"> {
  if (sessionType === VOCAL_SESSION_TYPE) return "보컬";
  if (sessionType === "기타1" || sessionType === "기타2") return "기타";
  if (sessionType === "베이스") return "베이스";
  if (sessionType === "건반") return "건반";
  if (sessionType === "드럼") return "드럼";
  return "그 외";
}

export type Member = {
  id: string;
  name: string;
  instrument: string;
  role: Role;
  is_admin: boolean;
  generation: number;
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
  artist: string | null;
  submitted_by: string;
  submitted_by_name: string | null;
  completed_at: string | null;
  sessions: SongSession[];
};

/** 항상 정시부터 1시간짜리 후보 슬롯이라 종료 시각은 따로 안 둔다 (starts_at + 1시간) */
export type RehearsalSlot = {
  id: string;
  song_id: string;
  starts_at: string;
};
