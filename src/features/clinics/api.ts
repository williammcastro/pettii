import { supabase } from "@/lib/supabase";

type ClinicInfo = {
  id: string;
  name: string | null;
  code: string | null;
};

export async function fetchPrimaryClinicForUser(
  userId: string
): Promise<ClinicInfo | null> {
  const { data, error } = await supabase
    .from("user_clinics")
    .select("clinic_id, clinics:clinic_id ( id, name, code )")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.clinic_id) return null;

  const clinic = data.clinics as { id?: string; name?: string; code?: string } | null;

  return {
    id: data.clinic_id,
    name: clinic?.name ?? null,
    code: clinic?.code ?? null,
  };
}

export async function joinClinicByCode(code: string): Promise<string> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) {
    throw new Error("El código de veterinaria es requerido.");
  }

  const { data, error } = await supabase.rpc("join_clinic_by_code", {
    p_code: normalized,
    p_make_primary: true,
  });

  if (error) throw error;
  return data as string;
}
