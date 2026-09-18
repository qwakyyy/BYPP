import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRehearsalGrid } from "./rehearsal-grid";

test("날짜별로 묶고 시간 순으로 정렬한다", () => {
  const grid = buildRehearsalGrid([
    { id: "b", starts_at: "2026-10-11T02:00:00" },
    { id: "a", starts_at: "2026-10-10T23:00:00" },
    { id: "c", starts_at: "2026-10-10T01:00:00" },
  ]);
  assert.deepEqual(
    grid.map((r) => r.date),
    ["2026-10-10", "2026-10-11"]
  );
  assert.deepEqual(grid[0].hours, [
    { hour: 1, slotId: "c" },
    { hour: 23, slotId: "a" },
  ]);
  assert.deepEqual(grid[1].hours, [{ hour: 2, slotId: "b" }]);
});

test("슬롯이 없으면 빈 배열", () => {
  assert.deepEqual(buildRehearsalGrid([]), []);
});
