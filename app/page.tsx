import Link from "next/link";
import { getCurrentPerformance, getPhaseWindows } from "@/lib/queries";
import { formatKst } from "@/lib/datetime";
import { nextTransitionTime } from "@/lib/phase-auto";
import { PHASE_LABEL } from "@/lib/types";

const PHASE_LINKS: Record<string, { href: string; label: string }> = {
  song_submission: { href: "/songs", label: "곡 등록하러 가기" },
  session_signup_phase1: { href: "/songs", label: "세션 신청하러 가기" },
  session_signup_phase2: { href: "/songs", label: "세션 신청하러 가기" },
  setlist_locked: { href: "/setlist", label: "셋리스트 보기" },
  scheduling: { href: "/setlist", label: "셋리스트에서 합주 일정 잡기" },
  done: { href: "/setlist", label: "지난 셋리스트 보기" },
};

export default async function DashboardPage() {
  const performance = await getCurrentPerformance();

  if (!performance) {
    return (
      <div className="rounded border bg-white p-6">
        <p className="text-gray-600">아직 등록된 공연이 없어요. 회장/부회장이 공연을 만들면 여기에 표시돼요.</p>
      </div>
    );
  }

  const action = PHASE_LINKS[performance.phase];
  const windows = await getPhaseWindows(performance.id);
  const nextTime = nextTransitionTime(performance.phase, windows);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded border bg-white p-6">
        <h1 className="text-lg font-semibold">{performance.title}</h1>
        {performance.event_date && (
          <p className="text-sm text-gray-500">공연일: {performance.event_date}</p>
        )}
        <p className="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-sm">
          현재 단계: {PHASE_LABEL[performance.phase]}
        </p>
        {nextTime && (
          <p className="mt-1 text-sm text-gray-500">다음 단계 전환: {formatKst(nextTime)}</p>
        )}
      </div>

      {action && (
        <Link
          href={action.href}
          className="rounded bg-black px-4 py-3 text-center text-white hover:bg-gray-800"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
