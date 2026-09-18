export type SongCompletion = {
  id: string;
  completedAt: string | null;
};

export type SetlistResult = {
  confirmed: SongCompletion[];
  dropped: SongCompletion[];
};

/** completedAt 순으로 정렬해 maxSetlistSize까지를 확정 셋리스트로 나눈다. */
export function computeSetlist(
  songs: SongCompletion[],
  maxSetlistSize: number | null
): SetlistResult {
  const completed = songs
    .filter((s): s is SongCompletion & { completedAt: string } => s.completedAt !== null)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt));

  if (maxSetlistSize == null) {
    return { confirmed: completed, dropped: [] };
  }

  return {
    confirmed: completed.slice(0, maxSetlistSize),
    dropped: completed.slice(maxSetlistSize),
  };
}

/** 1차 신청 기간: 이미 참여 중인 곡이면 항상 허용, 새 곡이면 cap 미만일 때만 허용. */
export function canClaimSongInPhase1(
  distinctSongIdsAlreadyClaimed: string[],
  targetSongId: string,
  cap: number
): boolean {
  if (distinctSongIdsAlreadyClaimed.includes(targetSongId)) return true;
  return distinctSongIdsAlreadyClaimed.length < cap;
}
