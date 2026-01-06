export type Product = {
  id: string;
  clinic_id: string;
  type: "product" | "service";
  name: string;
  description?: string | null;
  price_cents?: number | null;
  currency: string;
  category?: string | null;
  image_url?: string | null;
  image_signed_url?: string | null;
  is_active: boolean;
  created_at: string;
};
