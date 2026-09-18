import { PHASE_ORDER, type Phase } from "@/lib/types";

/** phase -> 그 phase가 시작되는 시각 (= 바로 앞 phase가 끝나는 시각이기도 하다) */
export type PhaseWindowMap = Partial<Record<Phase, { startsAt: string | null }>>;

/**
 * nextPhase로 넘어가기 위해 기다려야 하는 시각. setlist_locked는 자체 시각이 없고
 * session_signup_phase2가 끝나는 순간(= scheduling이 시작하는 시각)에 자동으로 지나간다.
 */
function triggerTimeFor(nextPhase: Phase, windows: PhaseWindowMap): string | null {
  if (nextPhase === "setlist_locked") return windows.scheduling?.startsAt ?? null;
  return windows[nextPhase]?.startsAt ?? null;
}

/**
 * 지금 시각 기준으로 몇 단계여야 하는지 계산한다. 절대 뒤로는 안 가고, 설정된 시간이 지난 만큼만
 * 순서대로 전진한다. 관리자가 수동으로 phase를 옮겨놨다면 이 함수는 그걸 덮어쓰지 않는다
 * (항상 currentPhase 이상만 반환).
 */
export function resolveAutoPhase(currentPhase: Phase, windows: PhaseWindowMap, now: Date): Phase {
  let phase = currentPhase;

  while (true) {
    const currentIndex = PHASE_ORDER.indexOf(phase);
    const nextPhase = PHASE_ORDER[currentIndex + 1];
    if (!nextPhase) break;

    const triggerTime = triggerTimeFor(nextPhase, windows);
    if (triggerTime && new Date(triggerTime) <= now) {
      phase = nextPhase;
      continue;
    }
    break;
  }

  return phase;
}

/** 대시보드에 "마감: ..."으로 보여줄, 다음 자동 전환 시각 (없으면 null) */
export function nextTransitionTime(currentPhase: Phase, windows: PhaseWindowMap): string | null {
  const nextPhase = PHASE_ORDER[PHASE_ORDER.indexOf(currentPhase) + 1];
  if (!nextPhase) return null;
  return triggerTimeFor(nextPhase, windows);
}
