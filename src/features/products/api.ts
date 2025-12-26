import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";

async function attachSignedProductUrls(products: Product[]): Promise<Product[]> {
  const paths = products
    .map((product) => product.image_url)
    .filter((path): path is string => !!path && !path.startsWith("http"));

  if (paths.length === 0) {
    return products.map((product) => ({
      ...product,
      image_signed_url: product.image_url ?? null,
    }));
  }

  const { data, error } = await supabase.storage
    .from("clinic_products")
    .createSignedUrls(paths, 60 * 60);

  if (error) {
    return products.map((product) => ({
      ...product,
      image_signed_url: null,
    }));
  }

  const urlByPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      urlByPath.set(item.path, item.signedUrl);
    }
  }

  return products.map((product) => {
    if (!product.image_url) {
      return { ...product, image_signed_url: null };
    }
    if (product.image_url.startsWith("http")) {
      return { ...product, image_signed_url: product.image_url };
    }
    return {
      ...product,
      image_signed_url: urlByPath.get(product.image_url) ?? null,
    };
  });
}

export async function fetchProductsForPrimaryClinic(
  userId: string
): Promise<Product[]> {
  const { data: primary, error: primaryError } = await supabase
    .from("user_clinics")
    .select("clinic_id")
    .eq("user_id", userId)
    .eq("is_primary", true)
    .maybeSingle();

  if (primaryError) throw primaryError;
  if (!primary?.clinic_id) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("clinic_id", primary.clinic_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return attachSignedProductUrls(data ?? []);
}
