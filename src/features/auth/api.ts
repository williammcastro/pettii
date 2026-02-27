import { supabase } from "@/lib/supabase";

export async function deleteMyAccount(input?: { reason?: string | null }) {
  const { data, error } = await supabase.functions.invoke("delete-account", {
    body: {
      reason: input?.reason ?? null,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.ok === false) {
    throw new Error(data?.detail ?? "No se pudo eliminar la cuenta.");
  }

  return data;
}
