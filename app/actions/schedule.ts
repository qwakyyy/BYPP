"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function toggleAvailabilityAction(slotId: string): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "로그인이 필요해요" };

  const supabase = createServiceClient();
  const { data: existing, error: existingError } = await supabase
    .from("availabilities")
    .select("id")
    .eq("slot_id", slotId)
    .eq("member_id", session.memberId)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase.from("availabilities").delete().eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("availabilities")
      .insert({ slot_id: slotId, member_id: session.memberId });
    if (error) throw error;
  }

  revalidatePath("/schedule");
  return {};
}
