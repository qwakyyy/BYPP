"use client";

import { createClient } from "@supabase/supabase-js";

/** 브라우저 전용 클라이언트. anon key만 사용, Realtime 구독(읽기 전용)에만 쓴다. */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
