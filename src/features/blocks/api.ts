import { supabase } from "@/lib/supabase";

export async function blockUser(input: {
  blocker_user_id: string;
  blocked_user_id: string;
}) {
  const { error } = await supabase.from("user_blocks").insert({
    blocker_user_id: input.blocker_user_id,
    blocked_user_id: input.blocked_user_id,
  });
  if (error) throw error;
}

export async function unblockUser(input: {
  blocker_user_id: string;
  blocked_user_id: string;
}) {
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_user_id", input.blocker_user_id)
    .eq("blocked_user_id", input.blocked_user_id);
  if (error) throw error;
}

export async function fetchBlockStatus(input: {
  blocker_user_id: string;
  blocked_user_id: string;
}): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocked_user_id")
    .eq("blocker_user_id", input.blocker_user_id)
    .eq("blocked_user_id", input.blocked_user_id)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}
