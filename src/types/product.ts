export type Product = {
  id: string;
  clinic_id: string;
  type: "product" | "service";
  name: string;
  label?: string | null;
  description?: string | null;
  price_cents?: number | null;
  currency: string;
  category?: string[] | string | null;
  image_url?: string | null;
  image_signed_url?: string | null;
  is_active: boolean;
  created_at: string;
};
