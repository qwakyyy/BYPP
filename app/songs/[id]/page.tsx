import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSongWithSessions } from "@/lib/queries";
import RealtimeRefresher from "@/components/RealtimeRefresher";
import { ClaimButton, UnclaimButton } from "@/components/SessionClaimButton";

export default async function SongDetailPage(props: PageProps<"/songs/[id]">) {
  const { id } = await props.params;
  const song = await getSongWithSessions(id);
  if (!song) notFound();

  const session = await getSession();

  return (
    <div className="flex flex-col gap-4">
      <RealtimeRefresher table="song_sessions" filter={`song_id=eq.${song.id}`} />

      <div>
        <h1 className="text-lg font-semibold">{song.title}</h1>
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
    </div>
  );
}
