import { test } from "node:test";
import assert from "node:assert/strict";
import { computeSetlist, canClaimSongInPhase1 } from "./setlist";

test("computeSetlist: completedAt 순 정렬 후 max로 자름", () => {
  const songs = [
    { id: "a", completedAt: "2026-01-01T10:00:00Z" },
    { id: "b", completedAt: null },
    { id: "c", completedAt: "2026-01-01T09:00:00Z" },
    { id: "d", completedAt: "2026-01-01T11:00:00Z" },
  ];
  const { confirmed, dropped } = computeSetlist(songs, 2);
  assert.deepEqual(
    confirmed.map((s) => s.id),
    ["c", "a"]
  );
  assert.deepEqual(
    dropped.map((s) => s.id),
    ["d"]
  );
});

test("computeSetlist: maxSetlistSize가 null이면 전부 확정", () => {
  const songs = [
    { id: "a", completedAt: "2026-01-01T10:00:00Z" },
    { id: "b", completedAt: "2026-01-01T09:00:00Z" },
  ];
  const { confirmed, dropped } = computeSetlist(songs, null);
  assert.equal(confirmed.length, 2);
  assert.equal(dropped.length, 0);
});

test("canClaimSongInPhase1: 이미 참여 중인 곡은 cap과 무관하게 허용", () => {
  assert.equal(canClaimSongInPhase1(["a", "b"], "a", 2), true);
});

test("canClaimSongInPhase1: cap 도달 시 새 곡은 거절", () => {
  assert.equal(canClaimSongInPhase1(["a", "b"], "c", 2), false);
});

test("canClaimSongInPhase1: cap 미만이면 새 곡 허용", () => {
  assert.equal(canClaimSongInPhase1(["a"], "c", 2), true);
});
