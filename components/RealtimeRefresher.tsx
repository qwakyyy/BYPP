"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";

/** table의 변경을 구독해서 다른 사람이 뭔가 바꾸면 이 화면도 새로고침한다 (읽기 전용). */
export default function RealtimeRefresher({
  table,
  filter,
}: {
  table: string;
  filter?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserClient();
    const channel = supabase
      .channel(`${table}-${filter ?? "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filter, router]);

  return null;
}
