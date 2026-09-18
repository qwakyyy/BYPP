import Link from "next/link";
import { getCurrentPerformance, getSongsWithSessions } from "@/lib/queries";
import { computeSetlist } from "@/lib/setlist";
import RealtimeRefresher from "@/components/RealtimeRefresher";

export default async function SetlistPage() {
  const performance = await getCurrentPerformance();
  if (!performance) return <p className="text-gray-600">아직 등록된 공연이 없어요.</p>;

  const songs = await getSongsWithSessions(performance.id);
  const { confirmed, dropped } = computeSetlist(
    songs.map((s) => ({ id: s.id, completedAt: s.completed_at })),
    performance.max_setlist_size
  );
  const byId = new Map(songs.map((s) => [s.id, s]));

  return (
    <div className="flex flex-col gap-6">
      <RealtimeRefresher table="songs" filter={`performance_id=eq.${performance.id}`} />

      <div>
        <h1 className="text-lg font-semibold">셋리스트</h1>
        {performance.max_setlist_size != null && (
          <p className="text-sm text-gray-500">정원: {performance.max_setlist_size}곡</p>
        )}
      </div>

      <section>
        <h2 className="mb-2 text-base font-semibold text-green-700">
          확정 ({confirmed.length}곡)
        </h2>
        <ol className="flex flex-col gap-2">
          {confirmed.map((c, i) => {
            const song = byId.get(c.id)!;
            return (
              <li key={song.id} className="rounded border bg-white px-4 py-3">
                <span className="mr-2 text-gray-400">{i + 1}.</span>
                <Link href={`/songs/${song.id}`} className="font-medium hover:underline">
                  {song.title}
                  {song.artist && <span className="text-gray-500"> - {song.artist}</span>}
                </Link>
                <span className="ml-2 text-xs text-gray-500">
                  {song.sessions.map((s) => `${s.session_type}: ${s.member_name ?? "-"}`).join(" / ")}
                </span>
                {performance.phase === "scheduling" && (
                  <Link href={`/songs/${song.id}`} className="ml-2 text-xs text-blue-600 underline">
                    합주 일정 잡기
                  </Link>
                )}
              </li>
            );
          })}
          {confirmed.length === 0 && (
            <p className="text-sm text-gray-500">아직 완성된 곡이 없어요.</p>
          )}
        </ol>
      </section>

      {dropped.length > 0 && (
        <section>
          <h2 className="mb-2 text-base font-semibold text-gray-500">
            정원 초과로 탈락 ({dropped.length}곡)
          </h2>
          <ul className="flex flex-col gap-2">
            {dropped.map((c) => {
              const song = byId.get(c.id)!;
              return (
                <li key={song.id} className="rounded border bg-gray-100 px-4 py-3 text-gray-500">
                  {song.title}
                  {song.artist && <span> - {song.artist}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
