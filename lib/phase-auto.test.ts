import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAutoPhase, nextTransitionTime } from "./phase-auto";

const NOW = new Date("2026-06-15T00:00:00Z");
const PAST = "2026-06-01T00:00:00Z";
const FUTURE = "2026-12-01T00:00:00Z";

test("윈도우가 없으면 그대로 머무른다", () => {
  assert.equal(resolveAutoPhase("draft", {}, NOW), "draft");
});

test("다음 phase의 시작 시각이 지났으면 한 단계 전진", () => {
  const result = resolveAutoPhase("draft", { song_submission: { startsAt: PAST } }, NOW);
  assert.equal(result, "song_submission");
});

test("아직 시작 시각이 안 됐으면 그대로 머무른다", () => {
  const result = resolveAutoPhase("draft", { song_submission: { startsAt: FUTURE } }, NOW);
  assert.equal(result, "draft");
});

test("여러 단계 시작 시각이 이미 다 지났으면 한 번에 여러 칸 전진", () => {
  const windows = {
    song_submission: { startsAt: PAST },
    session_signup_phase1: { startsAt: PAST },
  };
  assert.equal(resolveAutoPhase("draft", windows, NOW), "session_signup_phase1");
});

test("setlist_locked는 scheduling의 시작 시각으로 트리거된다 (2차 종료 = 조율 시작)", () => {
  const windows = { scheduling: { startsAt: PAST } };
  assert.equal(resolveAutoPhase("session_signup_phase2", windows, NOW), "scheduling");
});

test("scheduling 시작 시각이 아직 안 됐으면 setlist_locked로도 안 간다", () => {
  const windows = { scheduling: { startsAt: FUTURE } };
  assert.equal(resolveAutoPhase("session_signup_phase2", windows, NOW), "session_signup_phase2");
});

test("절대 뒤로 가지 않는다 (윈도우가 지워져도 현재보다 이전으로 안 감)", () => {
  assert.equal(resolveAutoPhase("scheduling", {}, NOW), "scheduling");
});

test("nextTransitionTime: 다음 트리거 시각을 반환", () => {
  const windows = { session_signup_phase1: { startsAt: FUTURE } };
  assert.equal(nextTransitionTime("song_submission", windows), FUTURE);
});

test("nextTransitionTime: 설정 없으면 null", () => {
  assert.equal(nextTransitionTime("song_submission", {}), null);
});
