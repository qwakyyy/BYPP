import Link from "next/link";
import { getCurrentPerformance, getSongsWithSessions } from "@/lib/queries";
import SongForm from "@/components/SongForm";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export default async function SongsPage() {
  const performance = await getCurrentPerformance();

  if (!performance) {
    return <p className="text-gray-600">아직 등록된 공연이 없어요.</p>;
  }

  const songs = await getSongsWithSessions(performance.id);

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresher table="songs" filter={`performance_id=eq.${performance.id}`} />

      {performance.phase === "song_submission" && (
        <section>
          <h2 className="mb-2 text-base font-semibold">곡 등록</h2>
          <SongForm />
        </section>
      )}
      {performance.phase !== "draft" && performance.phase !== "song_submission" && (
        <p className="text-sm text-gray-500">곡 등록 기간이 종료됐어요.</p>
      )}

      <section>
        <h2 className="mb-2 text-base font-semibold">등록된 곡 ({songs.length})</h2>
        {songs.length === 0 && <p className="text-sm text-gray-500">아직 등록된 곡이 없어요.</p>}
        <ul className="flex flex-col gap-2">
          {songs.map((song) => {
            const filled = song.sessions.filter((s) => s.member_id).length;
            return (
              <li key={song.id}>
                <Link
                  href={`/songs/${song.id}`}
                  className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-gray-50"
                >
                  <span>
                    {song.title}
                    {song.artist && <span className="text-gray-500"> - {song.artist}</span>}{" "}
                    {song.completed_at && (
                      <span className="ml-1 text-xs text-green-700">완성</span>
                    )}
                  </span>
                  <span className="text-sm text-gray-500">
                    {filled}/{song.sessions.length}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
