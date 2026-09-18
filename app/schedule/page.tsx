import { getSession } from "@/lib/auth";
import { getCurrentPerformance, getRehearsalSlots, getAvailabilityMap } from "@/lib/queries";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import AvailabilityCell from "@/components/AvailabilityCell";

function formatSlot(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const dateFmt = new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeFmt = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit" });
  return `${dateFmt.format(start)} ~ ${timeFmt.format(end)}`;
}

export default async function SchedulePage() {
  const session = await getSession();
  const performance = await getCurrentPerformance();
  if (!performance) return <p className="text-gray-600">아직 등록된 공연이 없어요.</p>;

  const slots = await getRehearsalSlots(performance.id);
  const availability = await getAvailabilityMap(slots.map((s) => s.id));

  return (
    <div className="flex flex-col gap-4">
      <RealtimeRefresher table="availabilities" />

      <div>
        <h1 className="text-lg font-semibold">합주 가능 시간</h1>
        <p className="text-sm text-gray-500">
          가능한 시간을 눌러서 체크하세요. 숫자는 그 시간에 가능하다고 답한 인원 수예요.
        </p>
      </div>

      {slots.length === 0 && (
        <p className="text-sm text-gray-500">아직 등록된 후보 시간이 없어요.</p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {slots.map((slot) => {
          const members = availability[slot.id] ?? [];
          return (
            <div key={slot.id} className="flex flex-col items-center gap-1 rounded border bg-white p-2">
              <span className="text-xs text-gray-600">{formatSlot(slot.starts_at, slot.ends_at)}</span>
              <AvailabilityCell
                slotId={slot.id}
                count={members.length}
                isMine={!!session && members.includes(session.memberId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
