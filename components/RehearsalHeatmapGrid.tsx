"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { setAvailabilityAction } from "@/app/actions/schedule";
import type { RehearsalGridRow } from "@/lib/rehearsal-grid";

function formatDateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "UTC",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(d);
}

export default function RehearsalHeatmapGrid({
  songId,
  grid,
  availability,
  currentMemberId,
}: {
  songId: string;
  grid: RehearsalGridRow[];
  availability: Record<string, string[]>;
  currentMemberId: string;
}) {
  const router = useRouter();
  // 드래그 중이거나 저장 응답을 기다리는 동안의 낙관적 상태. 저장이 끝나면 지워지고
  // 그때부터는 다시 availability prop(서버 값)이 그대로 진실이 된다.
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragValueRef = useRef(true);
  const touchedRef = useRef<Set<string>>(new Set());

  const serverMine = useMemo(
    () =>
      new Set(
        Object.entries(availability)
          .filter(([, ids]) => ids.includes(currentMemberId))
          .map(([slotId]) => slotId)
      ),
    [availability, currentMemberId]
  );

  const othersCount = useMemo(() => {
    const map: Record<string, number> = {};
    for (const [slotId, ids] of Object.entries(availability)) {
      map[slotId] = ids.filter((id) => id !== currentMemberId).length;
    }
    return map;
  }, [availability, currentMemberId]);

  function isMine(slotId: string): boolean {
    return overrides.has(slotId) ? overrides.get(slotId)! : serverMine.has(slotId);
  }

  useEffect(() => {
    if (!dragging) return;
    function finish() {
      setDragging(false);
      const slotIds = [...touchedRef.current];
      touchedRef.current.clear();
      if (slotIds.length === 0) return;
      setAvailabilityAction(songId, slotIds, dragValueRef.current).then((result) => {
        if (result.error) setError(result.error);
        setOverrides((prev) => {
          const next = new Map(prev);
          for (const id of slotIds) next.delete(id);
          return next;
        });
        router.refresh();
      });
    }
    window.addEventListener("mouseup", finish);
    window.addEventListener("touchend", finish);
    return () => {
      window.removeEventListener("mouseup", finish);
      window.removeEventListener("touchend", finish);
    };
  }, [dragging, songId, router]);

  function applyToSlot(slotId: string, value: boolean) {
    setOverrides((prev) => new Map(prev).set(slotId, value));
    touchedRef.current.add(slotId);
  }

  function handleCellDown(slotId: string) {
    const value = !isMine(slotId);
    dragValueRef.current = value;
    setDragging(true);
    applyToSlot(slotId, value);
  }

  function handleCellEnter(slotId: string) {
    if (!dragging || touchedRef.current.has(slotId)) return;
    applyToSlot(slotId, dragValueRef.current);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null;
    const slotId = el?.dataset.slotId;
    if (slotId) handleCellEnter(slotId);
  }

  if (grid.length === 0) {
    return <p className="text-sm text-gray-500">아직 등록된 후보 날짜가 없어요.</p>;
  }

  const maxCount = Math.max(
    1,
    ...grid.flatMap((row) =>
      row.hours.map(({ slotId }) => (othersCount[slotId] ?? 0) + (isMine(slotId) ? 1 : 0))
    )
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="select-none border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-50 px-2 py-1 text-left">날짜</th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="w-7 py-1 font-normal text-gray-500">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row) => (
              <tr key={row.date}>
                <td className="sticky left-0 whitespace-nowrap bg-gray-50 px-2 font-medium">
                  {formatDateLabel(row.date)}
                </td>
                {row.hours.map(({ hour, slotId }) => {
                  const count = (othersCount[slotId] ?? 0) + (isMine(slotId) ? 1 : 0);
                  const mine = isMine(slotId);
                  const intensity = count === 0 ? 0 : 0.15 + 0.65 * (count / maxCount);
                  return (
                    <td
                      key={hour}
                      data-slot-id={slotId}
                      onMouseDown={() => handleCellDown(slotId)}
                      onMouseEnter={() => handleCellEnter(slotId)}
                      onTouchStart={() => handleCellDown(slotId)}
                      onTouchMove={handleTouchMove}
                      className={`h-7 w-7 cursor-pointer border border-gray-100 text-center align-middle ${
                        mine ? "ring-2 ring-inset ring-black" : ""
                      }`}
                      style={{ backgroundColor: `rgba(37,99,235,${intensity})` }}
                      title={`${count}명 가능`}
                    >
                      {count > 0 ? count : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">칸을 누르거나 드래그해서 내가 가능한 시간을 표시하세요.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
