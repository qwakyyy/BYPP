import { createClient } from "@supabase/supabase-js";

/** 서버 전용 클라이언트. service role key로 RLS를 우회하므로 절대 클라이언트에 노출하지 않는다. */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
