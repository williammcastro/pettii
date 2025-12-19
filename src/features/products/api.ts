import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

export async function fetchProductsForPrimaryClinic(
  userId: string
): Promise<Product[]> {
  const { data: primary, error: primaryError } = await supabase
    .from("user_clinics")
    .select("clinic_id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .single();

  if (primaryError) throw primaryError;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("clinic_id", primary.clinic_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}
