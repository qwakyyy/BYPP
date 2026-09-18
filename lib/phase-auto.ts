import { PHASE_ORDER, type Phase } from "@/lib/types";

export type PhaseWindowMap = Partial<Record<Phase, { startsAt: string | null; endsAt: string | null }>>;

/**
 * 지금 시각 기준으로 몇 단계여야 하는지 계산한다. 절대 뒤로는 안 가고, 설정된 시간이 지난 만큼만
 * 순서대로 전진한다. setlist_locked는 자체 시간이 없고 session_signup_phase2의 종료 시각에
 * 자동으로 들어간다. 관리자가 수동으로 더 앞선 phase로 옮겨놨다면 이 함수는 그걸 덮어쓰지 않는다
 * (항상 currentPhase 이상만 반환).
 */
export function resolveAutoPhase(currentPhase: Phase, windows: PhaseWindowMap, now: Date): Phase {
  let phase = currentPhase;

  while (true) {
    const currentIndex = PHASE_ORDER.indexOf(phase);
    const nextPhase = PHASE_ORDER[currentIndex + 1];
    if (!nextPhase) break;

    if (nextPhase === "setlist_locked") {
      const endsAt = windows.session_signup_phase2?.endsAt;
      if (endsAt && new Date(endsAt) <= now) {
        phase = nextPhase;
        continue;
      }
      break;
    }

    const startsAt = windows[nextPhase]?.startsAt;
    if (startsAt && new Date(startsAt) <= now) {
      phase = nextPhase;
      continue;
    }
    break;
  }

  return phase;
}
