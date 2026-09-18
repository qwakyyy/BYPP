import { getSession, isOfficer } from "@/lib/auth";
import { getCurrentPerformance } from "@/lib/queries";
import { PHASE_LABEL } from "@/lib/types";
import { PerformanceForm, InviteCodeForm } from "@/components/AdminForms";
import PhaseControls from "@/components/PhaseControls";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || !isOfficer(session.role)) {
    return <p className="text-gray-600">회장/부회장만 볼 수 있는 페이지예요.</p>;
  }

  const performance = await getCurrentPerformance();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">관리</h1>

      {performance ? (
        <div className="rounded border bg-white p-4">
          <p className="font-medium">{performance.title}</p>
          <p className="mb-3 text-sm text-gray-500">현재 단계: {PHASE_LABEL[performance.phase]}</p>
          <PhaseControls currentPhase={performance.phase} />
        </div>
      ) : (
        <p className="text-sm text-gray-500">진행 중인 공연이 없어요. 아래에서 만들어주세요.</p>
      )}

      <PerformanceForm />
      <InviteCodeForm />
    </div>
  );
}
