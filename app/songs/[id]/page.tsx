import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import {
  getSongWithSessions,
  getSongsWithSessions,
  getCurrentPerformance,
  getRehearsalSlotsForSong,
  getAvailabilityMap,
} from "@/lib/queries";
import { computeSetlist } from "@/lib/setlist";
import { buildRehearsalGrid } from "@/lib/rehearsal-grid";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import { ClaimButton, UnclaimButton } from "@/components/SessionClaimButton";
import AddRehearsalDateForm from "@/components/AddRehearsalDateForm";
import RehearsalHeatmapGrid from "@/components/RehearsalHeatmapGrid";

export default async function SongDetailPage(props: PageProps<"/songs/[id]">) {
  const { id } = await props.params;
  const song = await getSongWithSessions(id);
  if (!song) notFound();

  const session = await getSession();
  const isMemberOfSong = song.sessions.some((s) => s.member_id === session?.memberId);
  const canManageSchedule = !!session && (isMemberOfSong || session.isAdmin);

  const performance = await getCurrentPerformance();
  const schedulingOpen =
    performance != null &&
    (performance.phase === "scheduling" || performance.phase === "done") &&
    song.completed_at != null;

  let isInFinalSetlist = false;
  if (schedulingOpen && performance) {
    const allSongs = await getSongsWithSessions(performance.id);
    const { confirmed } = computeSetlist(
      allSongs.map((s) => ({ id: s.id, completedAt: s.completed_at })),
      performance.max_setlist_size
    );
    isInFinalSetlist = confirmed.some((c) => c.id === song.id);
  }

  const slots = isInFinalSetlist ? await getRehearsalSlotsForSong(song.id) : [];
  const availability = await getAvailabilityMap(slots.map((s) => s.id));
  const grid = buildRehearsalGrid(slots);

  return (
    <div className="flex flex-col gap-4">
      <RealtimeRefresher table="song_sessions" filter={`song_id=eq.${song.id}`} />

      <div>
        <h1 className="text-lg font-semibold">
          {song.title}
          {song.artist && <span className="text-gray-500"> - {song.artist}</span>}
        </h1>
        <p className="text-sm text-gray-500">
          등록: {song.submitted_by_name ?? "알 수 없음"}
          {song.completed_at && <span className="ml-2 text-green-700">전 세션 완료</span>}
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {song.sessions.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between rounded border bg-white px-4 py-3"
          >
            <div>
              <p className="font-medium">{s.session_type}</p>
              {s.sheet_music_url && (
                <a
                  href={s.sheet_music_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  악보 보기
                </a>
              )}
              {s.member_name && <p className="text-sm text-gray-600">신청자: {s.member_name}</p>}
            </div>

            {!s.member_id && <ClaimButton songSessionId={s.id} />}
            {s.member_id && s.member_id === session?.memberId && (
              <UnclaimButton songSessionId={s.id} />
            )}
          </li>
        ))}
      </ul>

      {isInFinalSetlist && (
        <section className="flex flex-col gap-3 border-t pt-4">
          <RealtimeRefresher table="rehearsal_slots" filter={`song_id=eq.${song.id}`} />
          <RealtimeRefresher table="availabilities" />

          <div>
            <h2 className="text-base font-semibold">합주 가능 시간</h2>
            <p className="text-sm text-gray-500">
              이 곡에 참여하는 멤버끼리만 시간을 추가하고 응답할 수 있어요.
            </p>
          </div>

          {!canManageSchedule && (
            <p className="text-sm text-gray-500">이 곡의 세션에 참여한 멤버만 볼 수 있어요.</p>
          )}

          {canManageSchedule && session && (
            <>
              <RehearsalHeatmapGrid
                songId={song.id}
                grid={grid}
                availability={availability}
                currentMemberId={session.memberId}
              />
              <AddRehearsalDateForm songId={song.id} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
