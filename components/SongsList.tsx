"use client";

import { useState } from "react";
import Link from "next/link";
import { SESSION_CATEGORIES, categorize, type SessionCategory } from "@/lib/types";
import type { Song } from "@/lib/types";

export default function SongsList({ songs }: { songs: Song[] }) {
  const [filter, setFilter] = useState<SessionCategory>("전체");

  const visibleSongs =
    filter === "전체"
      ? songs
      : songs.filter((song) =>
          song.sessions.some((s) => !s.member_id && categorize(s.session_type) === filter)
        );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {SESSION_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === category ? "bg-black text-white" : "bg-white text-gray-700"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {visibleSongs.length === 0 && (
        <p className="text-sm text-gray-500">
          {filter === "전체" ? "아직 등록된 곡이 없어요." : `${filter} 세션이 빈 곡이 없어요.`}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {visibleSongs.map((song) => {
          const filled = song.sessions.filter((s) => s.member_id).length;
          return (
            <li key={song.id}>
              <Link
                href={`/songs/${song.id}`}
                className="flex items-center justify-between gap-3 rounded border bg-white px-4 py-3 hover:bg-gray-50"
              >
                <span>
                  {song.title}
                  {song.artist && <span className="text-gray-500"> - {song.artist}</span>}{" "}
                  {song.completed_at && (
                    <span className="ml-1 text-xs text-green-700">완성</span>
                  )}
                </span>
                <span className="shrink-0 text-right text-xs text-gray-500">
                  <span className="mr-2">
                    {filled}/{song.sessions.length}
                  </span>
                  {song.sessions.map((s) => s.session_type).join(", ")}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
