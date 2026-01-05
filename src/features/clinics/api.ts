import { supabase } from "@/lib/supabase";

type ClinicInfo = {
  id: string;
  name: string | null;
  code: string | null;
  logo_url: string | null;
  logo_signed_url: string | null;
  slogan: string | null;
};

async function signClinicLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const { data, error } = await supabase.storage
    .from("clinic_logos")
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function fetchPrimaryClinicForUser(
  userId: string
): Promise<ClinicInfo | null> {
  const { data, error } = await supabase
    .from("user_clinics")
    .select("clinic_id, clinics:clinic_id ( id, name, code, logo_url, slogan )")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.clinic_id) return null;

  const clinic = data.clinics as
    | { id?: string; name?: string; code?: string; logo_url?: string; slogan?: string }
    | null;

  const logo_signed_url = await signClinicLogoUrl(clinic?.logo_url ?? null);

  return {
    id: data.clinic_id,
    name: clinic?.name ?? null,
    code: clinic?.code ?? null,
    logo_url: clinic?.logo_url ?? null,
    logo_signed_url,
    slogan: clinic?.slogan ?? null,
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
