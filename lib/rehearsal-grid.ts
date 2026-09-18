export type RehearsalGridRow = { date: string; hours: { hour: number; slotId: string }[] };

/** starts_at("YYYY-MM-DDTHH:mm:ss") 목록을 날짜별 행 + 시간순 열로 묶는다 */
export function buildRehearsalGrid(slots: { id: string; starts_at: string }[]): RehearsalGridRow[] {
  const byDate = new Map<string, Map<number, string>>();
  for (const slot of slots) {
    const [date, time] = slot.starts_at.split("T");
    const hour = Number(time.slice(0, 2));
    if (!byDate.has(date)) byDate.set(date, new Map());
    byDate.get(date)!.set(hour, slot.id);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hours]) => ({
      date,
      hours: [...hours.entries()].sort(([a], [b]) => a - b).map(([hour, slotId]) => ({ hour, slotId })),
    }));
}
