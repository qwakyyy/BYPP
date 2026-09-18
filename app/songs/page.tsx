import { getCurrentPerformance, getSongsWithSessions } from "@/lib/queries";
import SongForm from "@/components/SongForm";
import SongsList from "@/components/SongsList";
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
        <SongsList songs={songs} />
      </section>
    </div>
  );
}
